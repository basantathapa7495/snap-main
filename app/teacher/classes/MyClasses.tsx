"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import Link from "next/link";
import NepaliDate from "nepali-date-converter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  Megaphone,
  Search,
  SlidersHorizontal,
  Users,
  X,
  XCircle,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase";
import {
  DOCUMENT_BUCKET,
  canInlinePreview,
  documentTypeLabel,
  formatDocumentDate,
  type SchoolDocument,
} from "@/lib/documents";
import {
  buildSchedule,
  classLabel,
  className,
  matchesStudent,
  nepalClock,
  nextLabel,
  nextSlot,
  normalize,
  normalizeGrade,
  sectionName,
  slotStatus,
  timeLabel,
  weekdays,
  type Assignment,
  type ClassRow,
  type LegacySlot,
  type Period,
  type Slot,
  type Student,
} from "@/lib/teacher-classes";

const panel =
  "rounded-[18px] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:border-slate-800 dark:bg-slate-900";
const muted = "text-slate-500 dark:text-slate-400";
const field =
  "h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900";
const tones = [
  "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
  "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
];
const tabs = [
  "Overview",
  "Students",
  "Schedule",
  "Materials",
  "Notes",
] as const;
type Tab = (typeof tabs)[number];
type Notice = {
  id: string;
  title: string;
  content: string;
  target_audience: string;
  target_class_id: string | null;
  target_class: string | null;
  target_section: string | null;
  status: string;
  created_at: string;
  created_by: string | null;
};
type Data = {
  schoolId: string;
  userId: string;
  teacherId: string;
  classes: ClassRow[];
  assignments: Assignment[];
  students: Student[];
  slots: Slot[];
  unresolved: number;
};
type Attendance = { student_id: string; status: string };

async function rows<T>(
  request: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[]> {
  const result: T[] = [];
  for (let from = 0; ; from += 500) {
    const response = await request(from, from + 499);
    if (response.error) throw new Error(response.error.message);
    result.push(...((response.data || []) as T[]));
    if ((response.data || []).length < 500) return result;
  }
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className={`${panel} p-6 text-center text-sm ${muted}`}>
      {children}
    </div>
  );
}
function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function ScheduleList({
  slots,
  clock,
  today = false,
}: {
  slots: Slot[];
  clock: ReturnType<typeof nepalClock>;
  today?: boolean;
}) {
  if (!slots.length)
    return <Empty>No periods scheduled{today ? " for today" : ""}.</Empty>;
  return (
    <div className={`${panel} divide-y divide-slate-100 overflow-hidden dark:divide-slate-800`}>
      {slots.map((slot) => {
        const status = today ? slotStatus(slot, clock) : weekdays[slot.weekday];
        const tone =
          status === "Completed"
            ? tones[1]
            : status === "Now"
              ? tones[0]
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
        return (
          <Link
            key={slot.id}
            href={`/teacher/classes/${slot.classId}`}
            className={`relative flex items-center gap-3 p-3.5 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:bg-slate-800 sm:p-4 ${today ? "pl-4" : ""}`}
          >
            {today && <span className={`absolute inset-y-0 left-0 w-1 ${status === "Completed" ? "bg-emerald-400" : status === "Now" ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`} />}
            <div className="w-20 shrink-0 text-xs">
              <p className="font-bold">{timeLabel(slot.start)}</p>
              <p className={`mt-1 ${muted}`}>
                {slot.end ? timeLabel(slot.end) : slot.period}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{slot.label}</p>
              <p className={`text-xs ${muted}`}>{slot.subject}</p>
              {slot.room && (
                <p className={`mt-1 flex items-center gap-1 text-xs ${muted}`}>
                  <MapPin size={12} />
                  {slot.room}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold sm:text-xs ${tone}`}
            >
              {status}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
function Metrics({
  items,
}: {
  items: {
    label: string;
    value: number;
    icon: typeof BookOpen;
    tone?: string;
  }[];
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {items.map((item, i) => (
        <div key={item.label} className={`min-w-0 rounded-[16px] border border-white/70 p-2.5 text-center shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-white/5 sm:p-4 ${item.tone || tones[i]}`}>
          <item.icon className="mx-auto mb-1.5 h-5 w-5" strokeWidth={2.1} />
          <p className="text-xl font-extrabold tabular-nums sm:text-2xl">
            {item.value}
          </p>
          <p className="mt-0.5 truncate text-[10px] font-medium text-slate-600 dark:text-slate-300 sm:text-xs">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
export default function MyClasses({
  classId,
  weekly = false,
}: {
  classId?: string;
  weekly?: boolean;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [tab, setTab] = useState<Tab>("Overview");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [filters, setFilters] = useState(false);
  const [clock, setClock] = useState(() => nepalClock());
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [materials, setMaterials] = useState<SchoolDocument[]>([]);
  const [notes, setNotes] = useState<Notice[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [opening, setOpening] = useState("");
  const [preview, setPreview] = useState<{
    document: SchoolDocument;
    url: string;
  } | null>(null);
  const [compose, setCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const previewDialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!preview) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    previewDialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPreview(null);
      if (event.key !== "Tab") return;
      const controls = previewDialog.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), iframe, [tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [preview]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(nepalClock()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      setData(null);
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user)
          throw new Error("Please sign in with your teacher account.");
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("school_id,role")
          .eq("user_id", auth.user.id)
          .single();
        if (profileError || profile?.role !== "teacher" || !profile.school_id)
          throw new Error("Teacher school access unavailable.");
        const schoolId = profile.school_id;
        const { data: teacher, error: teacherError } = await supabase
          .from("teachers")
          .select("id")
          .eq("school_id", schoolId)
          .eq("user_id", auth.user.id)
          .is("left_at", null)
          .single();
        if (teacherError || !teacher)
          throw new Error("Active teacher membership unavailable.");
        const year = Number(new NepaliDate(new Date()).format("YYYY"));
        const [assigned, classRows, periods, legacy, studentRows] =
          await Promise.all([
            rows<Assignment>((a, b) =>
              supabase
                .from("teacher_assignments")
                .select(
                  "id,class_id,class_name,subject,period_id,weekday,periods_per_week,academic_year",
                )
                .eq("school_id", schoolId)
                .eq("teacher_id", teacher.id)
                .eq("active", true)
                .order("id")
                .range(a, b),
            ),
            rows<ClassRow>((a, b) =>
              supabase
                .from("classes")
                .select(
                  "id,school_id,class_name,class,name,class_number,section_name,section,academic_year,archived_at",
                )
                .eq("school_id", schoolId)
                .eq("academic_year", year)
                .is("archived_at", null)
                .order("id")
                .range(a, b),
            ),
            rows<Period>((a, b) =>
              supabase
                .from("school_periods")
                .select(
                  "id,name,kind,position,start_time,end_time,academic_year",
                )
                .eq("school_id", schoolId)
                .eq("academic_year", year)
                .order("id")
                .range(a, b),
            ),
            rows<LegacySlot>((a, b) =>
              supabase
                .from("teacher_timetable_entries")
                .select(
                  "id,class_name,subject,weekday,start_time,end_time,room",
                )
                .eq("school_id", schoolId)
                .eq("teacher_id", teacher.id)
                .order("id")
                .range(a, b),
            ),
            rows<Student>((a, b) =>
              supabase
                .from("students")
                .select("id,name,class,section,roll_no")
                .eq("school_id", schoolId)
                .order("id")
                .range(a, b),
            ),
          ]);
        const current = assigned.filter(
          (a) => !a.academic_year || a.academic_year === String(year),
        );
        const classes = classRows
          .filter((c) => current.some((a) => a.class_id === c.id))
          .sort((a, b) =>
            classLabel(a).localeCompare(classLabel(b), undefined, {
              numeric: true,
            }),
          );
        const assignments = current.filter((a) =>
          classes.some((c) => c.id === a.class_id),
        );
        const students = studentRows
          .filter((s) => classes.some((c) => matchesStudent(s, c)))
          .sort(
            (a, b) =>
              (a.roll_no || "").localeCompare(b.roll_no || "", undefined, {
                numeric: true,
              }) || a.name.localeCompare(b.name),
          );
        if (active)
          setData({
            schoolId,
            teacherId: teacher.id,
            userId: auth.user.id,
            classes,
            assignments,
            students,
            slots: buildSchedule(classes, assignments, periods, legacy),
            unresolved: current.length - assignments.length,
          });
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Could not load assigned classes.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [refresh]);
  const selected = data?.classes.find((c) => c.id === classId);
  useEffect(() => {
    if (!data || !selected) return;
    let active = true;
    const d = data;
    const row = selected;
    async function loadDetails() {
      setDetailLoading(true);
      setDetailErrors({});
      setAttendance([]);
      setMaterials([]);
      setNotes([]);
      const ids = d.students
        .filter((s) => matchesStudent(s, row))
        .map((s) => s.id);
      const results = await Promise.allSettled([
        (async () => {
          const result: Attendance[] = [];
          for (let i = 0; i < ids.length; i += 150)
            result.push(
              ...(await rows<Attendance>((a, b) =>
                supabase
                  .from("attendance")
                  .select("student_id,status")
                  .eq("school_id", d.schoolId)
                  .eq("attendance_date", clock.date)
                  .in("student_id", ids.slice(i, i + 150))
                  .order("id")
                  .range(a, b),
              )),
            );
          return result;
        })(),
        rows<SchoolDocument>((a, b) =>
          supabase
            .from("documents")
            .select(
              "*,document_target_classes(class_id),document_target_teachers(teacher_id)",
            )
            .eq("school_id", d.schoolId)
            .eq("visible_teachers", true)
            .eq("principal_only", false)
            .eq("is_archived", false)
            .lte("publish_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .order("id")
            .range(a, b),
        ),
        rows<Notice>((a, b) =>
          supabase
            .from("notices")
            .select(
              "id,title,content,target_audience,target_class_id,target_class,target_section,status,created_at,created_by",
            )
            .eq("school_id", d.schoolId)
            .eq("status", "published")
            .in("target_audience", ["class", "section"])
            .order("created_at", { ascending: false })
            .order("id")
            .range(a, b),
        ),
      ]);
      if (!active) return;
      const failures: Record<string, string> = {};
      const [att, docs, notices] = results;
      if (att.status === "fulfilled") setAttendance(att.value);
      else failures.Attendance = "Attendance could not be loaded.";
      if (docs.status === "fulfilled")
        setMaterials(
          docs.value.filter(
            (doc) =>
              (!doc.expires_at || new Date(doc.expires_at) > new Date()) &&
              (doc.teacher_target_mode === "all" ||
                doc.document_target_teachers?.some(
                  (t) => t.teacher_id === d.teacherId,
                )) &&
              (!doc.document_target_classes?.length ||
                doc.document_target_classes.some((c) => c.class_id === row.id)),
          ),
        );
      else failures.Materials = "Materials could not be loaded.";
      if (notices.status === "fulfilled")
        setNotes(
          notices.value.filter((n) =>
            n.target_class_id
              ? n.target_class_id === row.id
              : normalizeGrade(n.target_class) ===
                  normalizeGrade(className(row)) &&
                (!n.target_section ||
                  normalize(n.target_section) === normalize(sectionName(row))),
          ),
        );
      else failures.Notes = "Class notes could not be loaded.";
      setDetailErrors(failures);
      setDetailLoading(false);
    }
    void loadDetails();
    return () => {
      active = false;
    };
  }, [data, selected, clock.date]);

  async function openDocument(doc: SchoolDocument, download = false) {
    if (opening) return;
    setOpening(doc.id);
    setActionError("");
    try {
      if (!download && !canInlinePreview(doc)) {
        setPreview({ document: doc, url: "" });
        return;
      }
      const { data: signed, error: signError } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(
          doc.storage_path,
          300,
          download ? { download: doc.original_file_name } : undefined,
        );
      if (signError || !signed?.signedUrl)
        throw new Error("Could not open this permitted document.");
      if (download) window.location.assign(signed.signedUrl);
      else setPreview({ document: doc, url: signed.signedUrl });
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Could not open document.",
      );
    } finally {
      setOpening("");
    }
  }
  async function saveNote(event: FormEvent) {
    event.preventDefault();
    if (!data || !selected || saving) return;
    setSaving(true);
    setActionError("");
    try {
      const now = new Date().toISOString();
      const { error: saveError } = await supabase
        .from("notices")
        .insert({
          school_id: data.schoolId,
          title: title.trim(),
          content: content.trim(),
          priority: "normal",
          target_audience: sectionName(selected) ? "section" : "class",
          target_class: className(selected),
          target_section: sectionName(selected) || null,
          target_class_id: selected.id,
          status: "published",
          published_at: now,
          publish_date: clock.date,
          updated_at: now,
          created_by: data.userId,
        })
        .select("id")
        .single();
      if (saveError)
        throw new Error(
          "Could not publish the class note. Your assignment may have changed.",
        );
      setCompose(false);
      setTitle("");
      setContent("");
      setRefresh((v) => v + 1);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not save note.");
    } finally {
      setSaving(false);
    }
  }
  const classStudents =
    selected && data
      ? data.students.filter((s) => matchesStudent(s, selected))
      : [];
  const subjects = [
    ...new Set(
      (data?.assignments || []).map((a) => a.subject.trim()).filter(Boolean),
    ),
  ].sort();
  const assignedSubjects = selected
    ? [
        ...new Set(
          data?.assignments
            .filter((a) => a.class_id === selected.id)
            .map((a) => a.subject),
        ),
      ]
    : [];
  const slots = (data?.slots || []).filter(
    (s) => !classId || s.classId === classId,
  );
  const today = slots.filter((s) => s.weekday === clock.weekday);
  const next = nextSlot(slots, clock);
  const visibleClasses = (data?.classes || []).filter((c) => {
    const own = data?.assignments.filter((a) => a.class_id === c.id) || [];
    return (
      `${classLabel(c)} ${own.map((a) => a.subject).join(" ")}`
        .toLowerCase()
        .includes(normalize(query)) &&
      (!subject || own.some((a) => a.subject.trim() === subject))
    );
  });
  const attendanceMap = new Map(
    attendance.map((a) => [a.student_id, normalize(a.status)]),
  );
  const present = [...attendanceMap.values()].filter(
    (s) => s === "present" || s === "late",
  ).length;
  const absent = [...attendanceMap.values()].filter(
    (s) => s === "absent",
  ).length;
  const leave = [...attendanceMap.values()].filter((s) =>
    ["leave", "on_leave", "on leave", "excused"].includes(s),
  ).length;
  const stats = [
    { label: "Classes", value: data?.classes.length || 0, icon: BookOpen },
    { label: "Students", value: data?.students.length || 0, icon: Users },
    { label: "Subjects", value: subjects.length, icon: FileText },
    {
      label: "Periods/week",
      value:
        (data?.slots.length || 0) +
        (data?.assignments
          .filter(
            (a) =>
              !data.slots.some(
                (s) =>
                  s.id.startsWith(`${a.id}-`) ||
                  (!a.period_id &&
                    s.classId === a.class_id &&
                    normalize(s.subject) === normalize(a.subject)),
              ),
          )
          .reduce((n, a) => n + a.periods_per_week, 0) || 0),
      icon: Clock3,
    },
  ];
  const materialsView = (recent = false) =>
    detailErrors.Materials ? (
      <Empty>{detailErrors.Materials}</Empty>
    ) : !materials.length ? (
      <Empty>No permitted materials for this class yet.</Empty>
    ) : (
      <div
        className={`${panel} divide-y divide-slate-100 dark:divide-slate-800`}
      >
        {materials.slice(0, recent ? 3 : undefined).map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 p-3">
            <div className="flex h-11 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
              <FileText size={19} />
              <span className="text-[8px] font-bold">
                {documentTypeLabel(doc)}
              </span>
            </div>
            <button
              onClick={() => void openDocument(doc)}
              disabled={Boolean(opening)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="break-words text-sm font-semibold">{doc.title}</p>
              <p className={`mt-1 text-[11px] ${muted}`}>
                {doc.document_target_classes?.length
                  ? "Class material"
                  : "Shared with teachers"}{" "}
                · {formatDocumentDate(doc.created_at)}
              </p>
            </button>
            <button
              aria-label={`Preview ${doc.title}`}
              onClick={() => void openDocument(doc)}
              disabled={Boolean(opening)}
              className="rounded-lg p-2 text-blue-600 dark:text-blue-300"
            >
              {opening === doc.id ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Eye size={17} />
              )}
            </button>
            {doc.access_mode === "preview_download" && (
              <button
                aria-label={`Download ${doc.title}`}
                disabled={Boolean(opening)}
                onClick={() => void openDocument(doc, true)}
                className="rounded-lg p-2 text-blue-600 dark:text-blue-300"
              >
                <Download size={17} />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  const notesView = (recent = false) =>
    detailErrors.Notes ? (
      <Empty>{detailErrors.Notes}</Empty>
    ) : !notes.length ? (
      <Empty>No class announcements or notes yet.</Empty>
    ) : (
      <div className="space-y-2">
        {notes.slice(0, recent ? 2 : undefined).map((note) => (
          <article
            key={note.id}
            className="rounded-2xl bg-amber-50/80 p-4 dark:bg-amber-400/10"
          >
            <div className="flex gap-3">
              <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
              <div className="min-w-0">
                <h3 className="break-words text-sm font-bold">{note.title}</h3>
                <p className={`mt-1 text-xs ${muted}`}>
                  {formatDocumentDate(note.created_at)}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {note.content}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-3.5 pb-28 pt-20 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
            {(classId || weekly) && (
              <Link
                href="/teacher/classes"
                className={`inline-flex items-center gap-2 text-sm font-medium ${muted}`}
              >
                <ArrowLeft size={18} />
                My Classes
              </Link>
            )}
            {loading ? (
              <div
                role="status"
                className="flex items-center justify-center gap-2 py-12"
              >
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                Loading your classes…
              </div>
            ) : error ? (
              <div role="alert" className={`${panel} p-5`}>
                <p>{error}</p>
                <button
                  onClick={() => setRefresh((v) => v + 1)}
                  className="mt-3 text-sm font-bold text-blue-600"
                >
                  Try again
                </button>
              </div>
            ) : classId && !selected ? (
              <Empty>
                This class is unavailable or is not assigned to you.
                <Link
                  href="/teacher/classes"
                  className="mt-3 block font-semibold text-blue-600"
                >
                  Return to My Classes
                </Link>
              </Empty>
            ) : (
              <>
                {!classId && (
                  <header>
                    <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.035em] sm:text-3xl">
                      {weekly ? "My Class Timetable" : "My Classes"}
                    </h1>
                    <p className={`mt-1 max-w-xl text-sm leading-5 ${muted}`}>
                      {weekly
                        ? "Your assigned teaching periods · Nepal time"
                        : "View your assigned classes, students, schedule and activities."}
                    </p>
                  </header>
                )}
                {weekly ? (
                  <div className="space-y-5">
                    {weekdays.map((day, index) => (
                      <Section
                        key={day}
                        title={
                          day + (index === clock.weekday ? " · Today" : "")
                        }
                      >
                        <ScheduleList
                          slots={slots.filter((s) => s.weekday === index)}
                          clock={clock}
                          today={index === clock.weekday}
                        />
                      </Section>
                    ))}
                  </div>
                ) : !classId ? (
                  <>
                    <div className="flex gap-2 pt-1">
                      <label className="relative min-w-0 flex-1">
                        <Search
                          size={18}
                          className={`absolute left-3.5 top-3.5 ${muted}`}
                        />
                        <input
                          aria-label="Search classes or subjects"
                          className={`${field} pl-10.5`}
                          placeholder="Search classes or subjects…"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                      <button
                        aria-label="Filter classes"
                        aria-expanded={filters}
                        aria-controls="class-filters"
                        onClick={() => setFilters((v) => !v)}
                        className={`${panel} flex h-12 w-12 shrink-0 items-center justify-center ${subject ? "border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-400/10" : muted}`}
                      >
                        <SlidersHorizontal size={19} />
                      </button>
                    </div>
                    {filters && (
                      <label
                        id="class-filters"
                        className="block text-xs font-semibold"
                      >
                        Subject
                        <select
                          aria-label="Filter by subject"
                          className={`${field} mt-1`}
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                        >
                          <option value="">All subjects</option>
                          {subjects.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    <Metrics items={stats} />
                    {!!data?.unresolved && (
                      <p className={`text-xs ${muted}`}>
                        Some assignments need a current class/section linked by
                        your school administrator.
                      </p>
                    )}
                    <Section title="Assigned Classes">
                      <div className="grid gap-2.5 md:grid-cols-2">
                        {visibleClasses.map((row, i) => {
                          const own =
                            data?.assignments.filter(
                              (a) => a.class_id === row.id,
                            ) || [];
                          return (
                            <Link
                              key={row.id}
                              href={`/teacher/classes/${row.id}`}
                              className={`${panel} group flex min-h-[112px] items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-500 sm:p-4`}
                            >
                              <div
                                className={`flex h-[86px] w-[68px] shrink-0 flex-col items-center justify-center rounded-[15px] ${tones[i % tones.length]}`}
                              >
                                <span className="text-xs">Grade</span>
                                <span className="text-2xl font-bold">
                                  {normalizeGrade(className(row))}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-[16px] font-extrabold tracking-tight">
                                  {classLabel(row)}
                                </h3>
                                <p
                                  className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${muted}`}
                                >
                                  <span className="inline-flex items-center gap-1">
                                    <Users size={13} />
                                    {
                                      data?.students.filter((s) =>
                                        matchesStudent(s, row),
                                      ).length
                                    }{" "}
                                    students
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <BookOpen size={13} />
                                    {[
                                      ...new Set(own.map((a) => a.subject)),
                                    ].join(", ") || "No subject assigned"}
                                  </span>
                                </p>
                                <p
                                  className={`mt-2 flex items-center gap-1.5 text-xs ${muted}`}
                                >
                                  <CalendarDays
                                    size={13}
                                    className="shrink-0"
                                  />
                                  Next:{" "}
                                  {nextLabel(
                                    nextSlot(
                                      data?.slots.filter(
                                        (s) => s.classId === row.id,
                                      ) || [],
                                      clock,
                                    ),
                                  )}
                                </p>
                              </div>
                              <ChevronRight
                                size={19}
                                className={`shrink-0 transition group-hover:translate-x-0.5 group-hover:text-blue-600 ${muted}`}
                              />
                            </Link>
                          );
                        })}
                      </div>
                      {!visibleClasses.length && (
                        <Empty>
                          {data?.classes.length
                            ? "No classes match your search or filter."
                            : "No classes assigned yet. Contact your school administrator."}
                        </Empty>
                      )}
                    </Section>
                    <Section
                      title="Today's Classes"
                      action={
                        <Link
                          href="/teacher/classes/schedule"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-300"
                        >
                          View full timetable
                          <ArrowRight size={14} />
                        </Link>
                      }
                    >
                      <ScheduleList slots={today} clock={clock} today />
                    </Section>
                  </>
                ) : (
                  selected && (
                    <>
                      <div className="relative overflow-hidden rounded-[20px] border border-blue-100 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 p-5 shadow-[0_8px_30px_-22px_rgba(37,99,235,0.65)] dark:border-blue-900/50 dark:from-blue-950/60 dark:via-slate-900 dark:to-indigo-950/50">
                        <div aria-hidden="true" className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-200/45 blur-2xl dark:bg-blue-500/10" />
                        <div aria-hidden="true" className="absolute bottom-3 right-4 flex items-end gap-1.5 text-blue-200/70 dark:text-blue-700/30">
                          <GraduationCap className="h-10 w-10" strokeWidth={1.5} />
                          <Users className="h-14 w-14" strokeWidth={1.4} />
                        </div>
                        <div className="relative max-w-[78%]">
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#10245f] dark:text-blue-100">
                          {classLabel(selected)}
                        </h1>
                        <div
                          className={`mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm ${muted}`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Users size={17} />
                            {classStudents.length} students
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <BookOpen size={17} />
                            {assignedSubjects.join(", ") ||
                              "No subject assigned"}
                          </span>
                        </div>
                        <p
                          className={`mt-3 flex items-center gap-2 text-sm ${muted}`}
                        >
                          <CalendarDays size={17} />
                          {selected.academic_year} Academic Year (BS)
                        </p>
                        </div>
                      </div>
                      <div
                        role="tablist"
                        aria-label="Class details"
                        className="-mx-3.5 flex overflow-x-auto border-b border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-950 sm:mx-0 sm:px-0"
                      >
                        {tabs.map((t) => (
                          <button
                            key={t}
                            role="tab"
                            id={`tab-${t}`}
                            aria-controls={`panel-${t}`}
                            aria-selected={tab === t}
                            tabIndex={tab === t ? 0 : -1}
                            onKeyDown={(event) => {
                              const index = tabs.indexOf(t);
                              const nextIndex =
                                event.key === "ArrowRight"
                                  ? (index + 1) % tabs.length
                                  : event.key === "ArrowLeft"
                                    ? (index + tabs.length - 1) % tabs.length
                                    : event.key === "Home"
                                      ? 0
                                      : event.key === "End"
                                        ? tabs.length - 1
                                        : null;
                              if (nextIndex === null) return;
                              event.preventDefault();
                              setTab(tabs[nextIndex]);
                              setQuery("");
                              setActionError("");
                              document
                                .getElementById(`tab-${tabs[nextIndex]}`)
                                ?.focus();
                            }}
                            onClick={() => {
                              setTab(t);
                              setQuery("");
                              setActionError("");
                            }}
                            className={`min-h-12 shrink-0 border-b-2 px-3 text-xs font-semibold sm:flex-1 sm:px-5 sm:text-sm ${tab === t ? "border-blue-600 text-blue-600 dark:text-blue-300" : `border-transparent ${muted}`}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      {actionError && (
                        <p
                          role="alert"
                          className="text-sm text-red-600 dark:text-red-300"
                        >
                          {actionError}
                        </p>
                      )}
                      <div
                        role="tabpanel"
                        id={`panel-${tab}`}
                        aria-labelledby={`tab-${tab}`}
                        className="space-y-5"
                      >
                        {tab === "Overview" && (
                          <>
                            {detailLoading ? (
                              <p role="status" className={`text-sm ${muted}`}>
                                Loading class activity…
                              </p>
                            ) : detailErrors.Attendance ? (
                              <Empty>{detailErrors.Attendance}</Empty>
                            ) : (
                              <>
                                <Metrics
                                  items={[
                                    {
                                      label: "Students",
                                      value: classStudents.length,
                                      icon: Users,
                                      tone: tones[1],
                                    },
                                    {
                                      label: "Present",
                                      value: present,
                                      icon: CheckCircle2,
                                      tone: tones[0],
                                    },
                                    {
                                      label: "Absent",
                                      value: absent,
                                      icon: XCircle,
                                      tone: "bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300",
                                    },
                                    {
                                      label: "On Leave",
                                      value: leave,
                                      icon: Clock3,
                                      tone: tones[2],
                                    },
                                  ]}
                                />
                                <p className={`text-xs ${muted}`}>
                                  {clock.date} · Nepal time. Late arrivals
                                  included in Present.
                                  {attendanceMap.size < classStudents.length
                                    ? ` ${classStudents.length - attendanceMap.size} students not marked yet.`
                                    : ""}
                                </p>
                              </>
                            )}
                            <Section title="Today's Class">
                              <ScheduleList slots={today} clock={clock} today />
                            </Section>
                            <Section title="Next Class">
                              {next ? (
                                <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4 dark:bg-blue-400/10">
                                  <Clock3 className="h-6 w-6 shrink-0 text-blue-600 dark:text-blue-300" />
                                  <div>
                                    <p className="text-sm font-bold">
                                      {next.slot.subject}
                                    </p>
                                    <p className={`mt-1 text-xs ${muted}`}>
                                      {nextLabel(next)} · {next.slot.period}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <Empty>No upcoming period scheduled.</Empty>
                              )}
                            </Section>
                            <Section
                              title="Recent Materials"
                              action={
                                <button
                                  className="text-xs font-semibold text-blue-600 dark:text-blue-300"
                                  onClick={() => setTab("Materials")}
                                >
                                  View all
                                </button>
                              }
                            >
                              {!detailLoading && materialsView(true)}
                            </Section>
                            <Section
                              title="Recent Announcements"
                              action={
                                <button
                                  className="text-xs font-semibold text-blue-600 dark:text-blue-300"
                                  onClick={() => setTab("Notes")}
                                >
                                  View all
                                </button>
                              }
                            >
                              {!detailLoading && notesView(true)}
                            </Section>
                          </>
                        )}
                        {tab === "Students" && (
                          <>
                            <input
                              className={field}
                              aria-label="Search students"
                              placeholder="Search students or roll number…"
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                            />
                            <div
                              className={`${panel} divide-y divide-slate-100 dark:divide-slate-800`}
                            >
                              {classStudents
                                .filter((s) =>
                                  `${s.name} ${s.roll_no || ""}`
                                    .toLowerCase()
                                    .includes(normalize(query)),
                                )
                                .map((s) => (
                                  <div
                                    key={s.id}
                                    className="flex items-center gap-3 p-3"
                                  >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                                      {s.roll_no || <GraduationCap size={18} />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="break-words text-sm font-semibold">
                                        {s.name}
                                      </p>
                                      <p className={`text-xs ${muted}`}>
                                        Roll {s.roll_no || "not set"} ·{" "}
                                        {classLabel(selected)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                            {!classStudents.filter((s) =>
                              `${s.name} ${s.roll_no || ""}`
                                .toLowerCase()
                                .includes(normalize(query)),
                            ).length && (
                              <Empty>
                                {query
                                  ? "No students match your search."
                                  : "No students enrolled in this class/section yet."}
                              </Empty>
                            )}
                          </>
                        )}
                        {tab === "Schedule" && (
                          <Section title="Weekly Schedule">
                            <ScheduleList slots={slots} clock={clock} />
                          </Section>
                        )}
                        {tab === "Materials" && (
                          <Section title="Class Materials">
                            {detailLoading ? (
                              <p role="status" className={`text-sm ${muted}`}>
                                Loading materials…
                              </p>
                            ) : (
                              materialsView()
                            )}
                          </Section>
                        )}
                        {tab === "Notes" && (
                          <Section
                            title="Class Notes & Announcements"
                            action={
                              <button
                                onClick={() => setCompose((v) => !v)}
                                className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                              >
                                {compose ? "Cancel" : "Add note"}
                              </button>
                            }
                          >
                            <p className={`text-xs ${muted}`}>
                              Notes are published as class announcements using
                              NEPSOM Communication.
                            </p>
                            {compose && (
                              <form
                                onSubmit={saveNote}
                                className={`${panel} space-y-3 p-4`}
                              >
                                <label className="block text-xs font-semibold">
                                  Title
                                  <input
                                    required
                                    maxLength={200}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`${field} mt-1`}
                                  />
                                </label>
                                <label className="block text-xs font-semibold">
                                  Class note
                                  <textarea
                                    required
                                    maxLength={5000}
                                    rows={4}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className={`${field} mt-1 h-auto py-3`}
                                  />
                                </label>
                                <button
                                  disabled={
                                    saving || !title.trim() || !content.trim()
                                  }
                                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                  {saving ? "Publishing…" : "Publish to class"}
                                </button>
                              </form>
                            )}
                            {detailLoading ? (
                              <p role="status" className={`text-sm ${muted}`}>
                                Loading class notes…
                              </p>
                            ) : (
                              notesView()
                            )}
                          </Section>
                        )}
                        {!!Object.keys(detailErrors).length && (
                          <button
                            onClick={() => setRefresh((v) => v + 1)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-300"
                          >
                            Retry class activity
                          </button>
                        )}
                      </div>
                    </>
                  )
                )}
              </>
            )}
          </div>
        </main>
      </div>
      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3"
          role="dialog"
          ref={previewDialog}
          aria-modal="true"
          aria-label={preview.document.title}
        >
          <div
            className={`${panel} flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-3 dark:border-slate-800">
              <h2 className="min-w-0 truncate text-sm font-bold">
                {preview.document.title}
              </h2>
              <button
                onClick={() => setPreview(null)}
                aria-label="Close preview"
                className="rounded-lg p-2"
              >
                <X size={20} />
              </button>
            </div>
            {preview.url ? (
              <iframe
                title={preview.document.title}
                src={preview.url}
                className="h-[70dvh] w-full bg-white"
              />
            ) : (
              <div className="space-y-3 p-6 text-sm">
                <p>In-app preview is available for PDFs and images.</p>
                {preview.document.access_mode === "preview_download" ? (
                  <button
                    onClick={() => void openDocument(preview.document, true)}
                    className="font-semibold text-blue-600"
                  >
                    Download file
                  </button>
                ) : (
                  <p>
                    This file is preview only. Ask your school for a PDF
                    version.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
