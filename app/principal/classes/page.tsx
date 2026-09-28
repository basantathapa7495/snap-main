"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Plus,
  Search,
  UserRound,
  Users,
  X,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import NepaliDate from "nepali-date-converter";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase";

type Section = {
  id: string;
  name: string;
  teacher: string | null;
  teacherId: string | null;
  students: number;
};

type Teacher = { id: string; name: string };

type ClassRow = {
  id: string;
  school_id: string | null;
  class_name: string | null;
  class: string | null;
  name: string | null;
  class_number: string | null;
  section: string | null;
  section_name: string | null;
  teacher_id: string | null;
  created_at: string | null;
  academic_year: number;
  archived_at: string | null;
};

type StudentRow = { class: string | null; section: string | null };

type SchoolClass = {
  id: string;
  name: string;
  teacher: string | null;
  teacherId: string | null;
  students: number;
  sections: Section[];
  academicYear: number;
};

type SectionForm = {
  name: string;
  teacherId: string;
};

const emptySection: SectionForm = {
  name: "",
  teacherId: "",
};

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function classLabel(row: ClassRow) {
  const value =
    row.class_name || row.class || row.name || row.class_number || "Unnamed class";
  return /^(class|grade)\s/i.test(value.trim())
    ? titleCase(value)
    : `Class ${value.trim()}`;
}

function buildClasses(
  rows: ClassRow[],
  teachers: Teacher[],
  students: StudentRow[],
) {
  const teacherNames = new Map(teachers.map((teacher) => [teacher.id, teacher.name]));
  const groups = new Map<string, SchoolClass>();

  for (const row of rows) {
    const name = classLabel(row);
    const key = `${row.academic_year}:${normalize(name)}`;
    const plainClass = name.replace(/^(Class|Grade)\s+/i, "");
    const classStudentCount = students.filter((student) =>
      [normalize(name), normalize(plainClass)].includes(normalize(student.class)),
    ).length;
    const current = groups.get(key) || {
      id: row.id,
      name,
      teacher: null,
      teacherId: null,
      students: classStudentCount,
      sections: [],
      academicYear: row.academic_year,
    };
    const sectionName = (row.section_name || row.section || "").trim();

    if (!sectionName) {
      current.id = row.id;
      current.teacherId = row.teacher_id;
      current.teacher = row.teacher_id
        ? teacherNames.get(row.teacher_id) || "Teacher unavailable"
        : null;
    } else {
      const studentCount = students.filter(
        (student) =>
          [normalize(name), normalize(plainClass)].includes(normalize(student.class)) &&
          normalize(student.section) === normalize(sectionName),
      ).length;

      current.sections.push({
        id: row.id,
        name: sectionName.toUpperCase(),
        teacher: row.teacher_id
          ? teacherNames.get(row.teacher_id) || "Teacher unavailable"
          : null,
        teacherId: row.teacher_id,
        students: studentCount,
      });
    }
    groups.set(key, current);
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true }),
  );
}

function titleCase(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const currentYear = Number(new NepaliDate(new Date()).format("YYYY"));
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [className, setClassName] = useState("");
  const [classTeacherId, setClassTeacherId] = useState("");
  const [activeClass, setActiveClass] = useState<SchoolClass | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionForm, setSectionForm] =
    useState<SectionForm>(emptySection);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !window.location.hash.startsWith('#class-')) return;
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [classes, loading]);

  useEffect(() => {
    let cancelled = false;

    async function loadClasses() {
      setError("");
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
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

        const [classesResult, teachersResult, studentsResult] =
          await Promise.all([
            supabase
              .from("classes")
              .select("id, school_id, class_name, class, name, class_number, section, section_name, teacher_id, created_at, academic_year, archived_at")
              .eq("school_id", profile.school_id)
              .is("archived_at", null)
              .order("created_at", { ascending: true }),
            supabase
              .from("teachers")
              .select("id, name")
              .eq("school_id", profile.school_id)
              .order("name", { ascending: true }),
            supabase
              .from("students")
              .select("class, section")
              .eq("school_id", profile.school_id),
          ]);

        if (classesResult.error) throw classesResult.error;
        if (teachersResult.error) throw teachersResult.error;
        if (studentsResult.error) throw studentsResult.error;

        if (!cancelled) {
          const teacherRows = (teachersResult.data || []) as Teacher[];
          const classRows = (classesResult.data || []) as ClassRow[];
          const schoolClasses = buildClasses(classRows, teacherRows, (studentsResult.data || []) as StudentRow[]);
          const linkedId = new URLSearchParams(window.location.search).get('class');
          const linkedRow = classRows.find((row) => row.id === linkedId);
          const linkedClass = linkedRow && schoolClasses.find((item) => normalize(item.name) === normalize(classLabel(linkedRow)));
          if (linkedClass) window.history.replaceState(window.history.state, '', `/principal/classes#class-${linkedClass.id}`);
          setSchoolId(profile.school_id);
          setTeachers(teacherRows);
          setClasses(schoolClasses);
        }
      } catch (loadError) {
        console.error("Classes page load error", loadError);
        if (!cancelled) setError(
          loadError instanceof Error ? loadError.message : "Classes could not be loaded.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadClasses();
    return () => { cancelled = true };
  }, [refreshKey]);

  const yearClasses = useMemo(() => classes.filter((item) => item.academicYear === selectedYear), [classes, selectedYear]);
  const years = useMemo(() => Array.from(new Set([currentYear, ...classes.map((item) => item.academicYear)])).sort((a, b) => b - a), [classes, currentYear]);
  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return yearClasses.filter((schoolClass) => {
      const matchesSearch =
        !query ||
        schoolClass.name.toLowerCase().includes(query) ||
        schoolClass.teacher?.toLowerCase().includes(query) ||
        schoolClass.sections.some(
          (section) =>
            section.name.toLowerCase().includes(query) ||
            section.teacher?.toLowerCase().includes(query),
        );

      return matchesSearch;
    });
  }, [yearClasses, search]);

  const totalSections = yearClasses.reduce(
    (total, schoolClass) => total + schoolClass.sections.length,
    0,
  );
  const totalStudents = selectedYear === currentYear ? yearClasses.reduce(
    (total, schoolClass) => total + schoolClass.students,
    0,
  ) : null;
  const unassignedSections = yearClasses.reduce(
    (total, schoolClass) =>
      total +
      schoolClass.sections.filter((section) => !section.teacherId).length,
    0,
  );

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  async function saveClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = titleCase(className);
    if (!schoolId || !name) return;

    if (
      yearClasses.some(
        (item) =>
          item.id !== editingClass?.id &&
          normalize(item.name) === normalize(name),
      )
    ) {
      setError("A class with this name already exists.");
      return;
    }
    if (editingClass && normalize(editingClass.name) !== normalize(name) && editingClass.students > 0) {
      setError("Move students out of this class before renaming it. Their records use the class name.");
      return;
    }

    setError("");
    const payload = {
      school_id: schoolId,
      academic_year: selectedYear,
      class_name: name,
      name,
      class_number: name.replace(/^Class\s+/i, "").trim() || null,
      teacher_id: classTeacherId || null,
    };
    const result = editingClass
      ? await supabase
          .from("classes")
          .update(payload)
          .eq("id", editingClass.id)
          .eq("school_id", schoolId)
      : await supabase.from("classes").insert(payload);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setClassName("");
    setClassTeacherId("");
    setEditingClass(null);
    setClassModalOpen(false);
    showNotice(editingClass ? "Class updated successfully." : `${name} added successfully.`);
    setRefreshKey((value) => value + 1);
  }

  function openAddSection(schoolClass: SchoolClass) {
    setActiveClass(schoolClass);
    setEditingSection(null);
    setSectionForm(emptySection);
  }

  function openEditSection(schoolClass: SchoolClass, section: Section) {
    setActiveClass(schoolClass);
    setEditingSection(section);
    setSectionForm({
      name: section.name,
      teacherId: section.teacherId || "",
    });
  }

  async function saveSection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId || !activeClass || !sectionForm.name.trim()) return;

    const sectionName = sectionForm.name.trim().toUpperCase();
    const duplicate = activeClass.sections.some(
      (section) =>
        section.id !== editingSection?.id &&
        normalize(section.name) === normalize(sectionName),
    );
    if (duplicate) {
      setError(`Section ${sectionName} already exists in ${activeClass.name}.`);
      return;
    }
    if (editingSection && normalize(editingSection.name) !== normalize(sectionName) && editingSection.students > 0) {
      setError("Move students out of this section before renaming it. Their records use the section name.");
      return;
    }

    setError("");
    const payload = {
      school_id: schoolId,
      academic_year: selectedYear,
      class_name: activeClass.name,
      name: activeClass.name,
      class_number: activeClass.name.replace(/^Class\s+/i, "").trim() || null,
      section: sectionName,
      section_name: sectionName,
      teacher_id: sectionForm.teacherId || null,
    };
    const result = editingSection
      ? await supabase.from("classes").update(payload)
          .eq("id", editingSection.id).eq("school_id", schoolId)
      : await supabase.from("classes").insert(payload);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setActiveClass(null);
    setEditingSection(null);
    setSectionForm(emptySection);
    showNotice(editingSection ? "Section updated successfully." : "Section added successfully.");
    setRefreshKey((value) => value + 1);
  }

  async function deleteSection(_classId: string, section: Section) {
    if (section.students > 0) { setError("Move students out of this section before archiving it."); return; }
    if (!schoolId || !window.confirm(`Archive Section ${section.name}? Its history will be kept.`)) return;
    setError("");
    const { error: deleteError } = await supabase
      .from("classes").update({ archived_at: new Date().toISOString() }).eq("id", section.id).eq("school_id", schoolId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    showNotice("Section archived.");
    setRefreshKey((value) => value + 1);
  }

  async function deleteClass(schoolClass: SchoolClass) {
    if (schoolClass.students > 0) { setError("Move students out of this class before archiving it."); return; }
    if (!schoolId || !window.confirm(
      `Archive ${schoolClass.name} and its sections? Their history will be kept.`,
    )) return;

    setError("");
    const ids = Array.from(new Set([
      schoolClass.id,
      ...schoolClass.sections.map((section) => section.id),
    ]));
    const { error: deleteError } = await supabase
      .from("classes").update({ archived_at: new Date().toISOString() }).in("id", ids).eq("school_id", schoolId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    showNotice(`${schoolClass.name} archived.`);
    setRefreshKey((value) => value + 1);
  }

  const hasFilters = Boolean(search.trim());

  if (loading) return <ClassesSkeleton />;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="pt-10 lg:ml-64">
          <TopBar />
          <main className="px-4 pb-24 pt-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1500px] rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
              Please sign in again to manage classes.
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f9ff] dark:bg-slate-950">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />

        <main className="flex-1 px-3.5 pb-28 pt-7 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1500px]">
            <header className="relative flex min-h-[112px] items-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#d9edff] via-[#eaf5ff] to-[#d9edff] px-3.5 py-3 dark:from-blue-950 dark:via-slate-900 dark:to-blue-950 sm:min-h-[150px] sm:px-8">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-300/45 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 sm:h-20 sm:w-20"><GraduationCap className="h-9 w-9 sm:h-12 sm:w-12" /></span>
              <div className="relative z-10 ml-3 min-w-0 sm:ml-6"><h1 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Classes &amp; Sections</h1><p className="mt-1 max-w-sm text-xs leading-4 text-slate-600 dark:text-slate-300 sm:text-sm">Manage classes, sections and student placement.</p></div>
              <svg aria-hidden="true" viewBox="0 0 150 105" className="pointer-events-none absolute bottom-0 right-0 hidden h-[90%] w-28 text-blue-500 opacity-55 min-[430px]:block sm:w-44"><path d="M6 54 42 21l35 33v44H6zm65 3 26-42 27 42v41H71z" fill="currentColor" opacity=".12"/><path d="M25 72h16v26H25zm72-9h12v35H97z" fill="currentColor" opacity=".25"/><path d="M26 53h9m58 0h8M100 29v-9m-12 9h24" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/><path d="M57 88h78v10H57zm10-15h66v12H67zm12-16h48v12H79z" fill="currentColor" opacity=".38"/><path d="M77 70h58M64 85h72" stroke="white" strokeWidth="2" opacity=".7"/></svg>
            </header>

            {error && <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
            {notice && <div role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"><CheckCircle2 className="h-4 w-4 shrink-0" />{notice}</div>}

            <section aria-label="Class summary" className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-3">
              <StatCard icon={BookOpen} label="Classes" value={yearClasses.length} tone="blue" />
              <StatCard icon={BookOpen} label="Sections" value={totalSections} tone="emerald" />
              <StatCard icon={Users} label="Students" value={totalStudents} tone="amber" />
              <StatCard icon={UserRound} label="Unassigned" value={unassignedSections} tone="rose" />
            </section>

            <div className="mt-4 flex gap-2">
              <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search class or teacher..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-sm" /></div>
              <button type="button" onClick={() => { setError(""); setEditingClass(null); setClassName(""); setClassTeacherId(""); setClassModalOpen(true); }} className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 sm:px-5 sm:text-sm"><Plus className="h-4 w-4" /> Add</button>
            </div>

            <label className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"><CalendarDays className="h-4 w-4 text-blue-600" />Academic Year:
              <select aria-label="Academic year" value={selectedYear} onChange={(event) => { setSelectedYear(Number(event.target.value)); setExpandedClass(null); }} className="min-w-0 flex-1 appearance-none bg-transparent text-xs font-semibold outline-none dark:text-white sm:text-sm">{years.map((year) => <option key={year} value={year}>{year} / {String((year + 1) % 100).padStart(2, "0")}</option>)}</select><ChevronDown className="h-4 w-4 text-slate-500" />
            </label>
            {selectedYear !== currentYear && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Student placement is stored for the current year only; historical student totals are unavailable.</p>}

            <section className="mt-5" aria-label="All classes">
              <div className="mb-2 flex items-end justify-between"><h2 className="text-xl font-extrabold text-slate-950 dark:text-white">All Classes</h2><span className="text-xs text-slate-500 dark:text-slate-400">{filteredClasses.length} classes</span></div>
              {filteredClasses.length === 0 ? <EmptyState filtered={hasFilters} onAdd={() => { setEditingClass(null); setClassName(""); setClassTeacherId(""); setClassModalOpen(true); }} /> :
                <div className="space-y-2.5">{filteredClasses.map((schoolClass) => <div key={schoolClass.id} id={`class-${schoolClass.id}`} className="scroll-mt-24"><ClassCard schoolClass={schoolClass} expanded={(expandedClass === null && filteredClasses[0]?.id === schoolClass.id) || expandedClass === schoolClass.id || (Boolean(search.trim()) && (schoolClass.sections.some((section) => section.name.toLowerCase().includes(search.toLowerCase()) || section.teacher?.toLowerCase().includes(search.toLowerCase()))))} onToggle={() => setExpandedClass((current) => (current === schoolClass.id || (current === null && filteredClasses[0]?.id === schoolClass.id)) ? "" : schoolClass.id)} showStudents={selectedYear === currentYear} onAddSection={openAddSection} onEditClass={(item) => { setError(""); setEditingClass(item); setClassName(item.name); setClassTeacherId(item.teacherId || ""); setClassModalOpen(true); }} onEditSection={openEditSection} onDeleteSection={deleteSection} onDeleteClass={deleteClass} /></div>)}</div>}
            </section>
          </div>
        </main>
      </div>

      {classModalOpen && (
        <Modal onClose={() => setClassModalOpen(false)} width="max-w-md">
                   <form onSubmit={saveClass}>
            <ModalHeader
              title={editingClass ? "Edit class" : "Add a new class"}
              description={
                editingClass
                  ? "Update the class name or assigned class teacher."
                  : "Create the class and optionally assign its class teacher."
              }
              onClose={() => setClassModalOpen(false)}
            />
            <div className="space-y-4 p-6">
              <Field
                label="Class name"
                value={className}
                onChange={setClassName}
                placeholder="For example: Class 7"
                required
              />
              <SelectField
                label="Class teacher"
                value={classTeacherId}
                onChange={setClassTeacherId}
                options={teachers}
              />
            </div>
            <ModalFooter
              submitLabel={editingClass ? "Save changes" : "Add class"}
              disabled={!className.trim()}
              onCancel={() => setClassModalOpen(false)}
            />
          </form>
        </Modal>
      )}

      {activeClass && (
        <Modal onClose={() => setActiveClass(null)} width="max-w-lg">
          <form onSubmit={saveSection}>
            <ModalHeader
              title={editingSection ? "Edit section" : "Add section"}
              description={`${activeClass.name} · Add the section details and class teacher.`}
              onClose={() => setActiveClass(null)}
            />
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <Field
                label="Section"
                value={sectionForm.name}
                onChange={(value) =>
                  setSectionForm((current) => ({ ...current, name: value }))
                }
                placeholder="A"
                required
              />
              <div className="sm:col-span-2">
                <SelectField
                  label="Class teacher"
                  value={sectionForm.teacherId}
                  onChange={(value) =>
                    setSectionForm((current) => ({ ...current, teacherId: value }))
                  }
                  options={teachers}
                />
              </div>
            </div>
            <ModalFooter
              submitLabel={editingSection ? "Save changes" : "Add section"}
              disabled={!sectionForm.name.trim()}
              onCancel={() => setActiveClass(null)}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number | null; tone: "blue" | "emerald" | "amber" | "rose" }) {
  const tones = { blue: "border-blue-200 text-blue-600 bg-blue-100 dark:border-blue-800 dark:bg-blue-500/20", emerald: "border-emerald-200 text-emerald-600 bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-500/20", amber: "border-amber-200 text-amber-600 bg-amber-100 dark:border-amber-800 dark:bg-amber-500/20", rose: "border-rose-200 text-rose-600 bg-rose-100 dark:border-rose-800 dark:bg-rose-500/20" };
  return <div className={`flex min-w-0 items-center gap-1 rounded-xl border bg-white px-1 py-2 shadow-sm dark:bg-slate-900 sm:gap-3 sm:px-4 sm:py-3 ${tones[tone].split(" ").filter((item) => item.startsWith("border-")).join(" ")}`}>
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 ${tones[tone].split(" ").filter((item) => !item.startsWith("border-")).join(" ")}`}><Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" /></span><span className="min-w-0"><span className="block truncate text-[8px] leading-tight font-medium text-slate-600 dark:text-slate-300 min-[380px]:text-[9px] sm:text-xs">{label}</span><span className="mt-0.5 block text-base font-extrabold leading-none tabular-nums text-slate-950 dark:text-white sm:text-2xl">{value === null ? "—" : value.toLocaleString()}</span></span>
  </div>;
}

function ClassCard({ schoolClass, expanded, onToggle, showStudents, onAddSection, onEditClass, onEditSection, onDeleteSection, onDeleteClass }: {
  schoolClass: SchoolClass; expanded: boolean; onToggle: () => void; showStudents: boolean;
  onAddSection: (schoolClass: SchoolClass) => void;
  onEditClass: (schoolClass: SchoolClass) => void;
  onEditSection: (schoolClass: SchoolClass, section: Section) => void;
  onDeleteSection: (classId: string, section: Section) => void;
  onDeleteClass: (schoolClass: SchoolClass) => void;
}) {
  const displayName = schoolClass.name.replace(/^Class\s+(\d+)$/i, "Grade $1");
  return <article className={`rounded-2xl border shadow-sm ${expanded ? "border-blue-200 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/50" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>
    <button type="button" aria-expanded={expanded} onClick={onToggle} className="flex w-full items-center gap-3 p-3 text-left sm:p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300"><BookOpen className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-950 dark:text-white sm:text-lg">{displayName}</span><span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{showStudents ? `${schoolClass.students} students` : "Students unavailable"} · {schoolClass.sections.length} sections</span></span>
      <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
    </button>
    {expanded && <div className="space-y-2 px-2.5 pb-3 sm:px-4 sm:pb-4">
      {schoolClass.sections.length === 0 && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">No sections yet. Add one when this class needs separate groups.</p>}
      {schoolClass.sections.map((section, index) => <div key={section.id} className="rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900 sm:p-3">
        <div className="flex items-center gap-2.5"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${["bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300", "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300", "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"][index % 3]}`}>{section.name.slice(0, 2)}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-950 dark:text-white">Section {section.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{showStudents ? `${section.students} students` : "Students unavailable"}</p></div>
          <div className="min-w-0 flex-1 border-l border-slate-200 pl-2 dark:border-slate-700"><p className="text-[10px] text-slate-500 dark:text-slate-400">Class Teacher</p><p className={`truncate text-xs font-semibold ${section.teacher ? "text-slate-800 dark:text-slate-100" : "text-rose-600 dark:text-rose-300"}`}>{section.teacher || "Not assigned"}</p></div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 pl-[50px] text-[11px] font-semibold sm:text-xs">
          {showStudents && <Link href={`/principal/students?class=${encodeURIComponent(schoolClass.name)}&section=${encodeURIComponent(section.name)}`} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2 py-1.5 text-blue-700 dark:border-blue-700 dark:text-blue-300"><Users className="h-3.5 w-3.5" /> View students</Link>}
          <button type="button" onClick={() => onEditSection(schoolClass, section)} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2 py-1.5 text-blue-700 dark:border-blue-700 dark:text-blue-300">✎ Edit</button>
          {!section.teacherId && <button type="button" onClick={() => onEditSection(schoolClass, section)} className="rounded-lg border border-blue-200 px-2 py-1.5 text-blue-700 dark:border-blue-700 dark:text-blue-300">Assign teacher</button>}
          <button type="button" onClick={() => onDeleteSection(schoolClass.id, section)} className="rounded-lg px-1 py-1.5 text-rose-600 dark:text-rose-300">Archive</button>
        </div>
      </div>)}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-semibold"><button type="button" onClick={() => onAddSection(schoolClass)} className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300"><Plus className="h-4 w-4" /> Add section</button><span className="flex gap-3"><button type="button" onClick={() => onEditClass(schoolClass)} className="text-blue-700 dark:text-blue-300">Edit class</button><button type="button" onClick={() => onDeleteClass(schoolClass)} className="text-rose-600 dark:text-rose-300">Archive class</button></span></div>
    </div>}
  </article>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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
        min={type === "number" ? 0 : undefined}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
  options: Teacher[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        <option value="">Not assigned</option>
        {options.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
        ))}
      </select>
      {options.length === 0 && (
        <span className="mt-1.5 block text-xs text-amber-600">
          Add teachers from the Teachers page first.
        </span>
      )}
    </label>
  );
}

function ModalHeader({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
      <div>
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function ModalFooter({
  submitLabel,
  disabled,
  onCancel,
}: {
  submitLabel: string;
  disabled: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
      >
        Cancel
      </button>
      <button
        disabled={disabled}
        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitLabel}
      </button>
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
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-white ${width}`}
      >
        {children}
      </div>
    </div>
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
        {filtered ? "No matching classes" : "No classes added yet"}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {filtered
          ? "Try changing the search or teacher filter."
          : "Add your first class to create the academic structure."}
      </p>
      {!filtered && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add class
        </button>
      )}
    </div>
  );
}


function ClassesSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pt-10 lg:ml-64">
        <TopBar />
        <main className="px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px] animate-pulse">
            <div className="h-24 border-b border-slate-200" />
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-24 rounded-2xl bg-white" />
              ))}
            </div>
            <div className="mt-6 h-96 rounded-2xl bg-white" />
          </div>
        </main>
      </div>
    </div>
  );
}
