"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
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
};

type StudentRow = { class: string | null; section: string | null };

type SchoolClass = {
  id: string;
  name: string;
  sections: Section[];
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
  return /^class\s/i.test(value.trim())
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
    const key = normalize(name);
    const current = groups.get(key) || { id: row.id, name, sections: [] };
    const sectionName = (row.section_name || row.section || "").trim();

    if (sectionName) {
      const plainClass = name.replace(/^Class\s+/i, "");
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

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [assignment, setAssignment] = useState<
    "All" | "Assigned" | "Unassigned"
  >("All");
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [activeClass, setActiveClass] = useState<SchoolClass | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionForm, setSectionForm] =
    useState<SectionForm>(emptySection);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadClasses() {
      setRefreshing(true);
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
              .select("id, school_id, class_name, class, name, class_number, section, section_name, teacher_id, created_at")
              .eq("school_id", profile.school_id)
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
          setSchoolId(profile.school_id);
          setTeachers(teacherRows);
          setClasses(buildClasses(
            (classesResult.data || []) as ClassRow[],
            teacherRows,
            (studentsResult.data || []) as StudentRow[],
          ));
        }
      } catch (loadError) {
        console.error("Classes page load error", loadError);
        if (!cancelled) setError(
          loadError instanceof Error ? loadError.message : "Classes could not be loaded.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadClasses();
    return () => { cancelled = true };
  }, [refreshKey]);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return classes
      .map((schoolClass) => ({
        ...schoolClass,
        sections: schoolClass.sections.filter((section) => {
          const matchesQuery =
            !query ||
            schoolClass.name.toLowerCase().includes(query) ||
            section.name.toLowerCase().includes(query) ||
            section.teacher?.toLowerCase().includes(query);

          const matchesAssignment =
            assignment === "All" ||
            (assignment === "Assigned"
              ? Boolean(section.teacher)
              : !section.teacher);

          return matchesQuery && matchesAssignment;
        }),
      }))
      .filter(
        (schoolClass) =>
          schoolClass.sections.length > 0 ||
          (assignment === "All" &&
            schoolClass.name.toLowerCase().includes(query)),
      );
  }, [assignment, classes, search]);

  const totalSections = classes.reduce(
    (total, schoolClass) => total + schoolClass.sections.length,
    0,
  );
  const totalStudents = classes.reduce(
    (total, schoolClass) =>
      total +
      schoolClass.sections.reduce(
        (sectionTotal, section) => sectionTotal + section.students,
        0,
      ),
    0,
  );
  const unassignedSections = classes.reduce(
    (total, schoolClass) =>
      total +
      schoolClass.sections.filter((section) => !section.teacher).length,
    0,
  );

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  async function addClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = titleCase(className);
    if (!schoolId || !name) return;
    if (classes.some((item) => normalize(item.name) === normalize(name))) {
      setError("A class with this name already exists.");
      return;
    }

    setError("");
    const { error: insertError } = await supabase.from("classes").insert({
      school_id: schoolId,
      class_name: name,
      name,
      class_number: name.replace(/^Class\s+/i, "").trim() || null,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setClassName("");
    setClassModalOpen(false);
    showNotice(`${name} added successfully.`);
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

    setError("");
    const payload = {
      school_id: schoolId,
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
    if (!schoolId || !window.confirm(`Delete Section ${section.name}?`)) return;
    setError("");
    const { error: deleteError } = await supabase
      .from("classes").delete().eq("id", section.id).eq("school_id", schoolId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    showNotice("Section deleted.");
    setRefreshKey((value) => value + 1);
  }

  async function deleteClass(schoolClass: SchoolClass) {
    if (!schoolId || !window.confirm(
      `Delete ${schoolClass.name} and all of its sections? This cannot be undone.`,
    )) return;

    setError("");
    const ids = Array.from(new Set([
      schoolClass.id,
      ...schoolClass.sections.map((section) => section.id),
    ]));
    const { error: deleteError } = await supabase
      .from("classes").delete().in("id", ids).eq("school_id", schoolId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    showNotice(`${schoolClass.name} deleted.`);
    setRefreshKey((value) => value + 1);
  }

  const hasFilters = Boolean(search.trim()) || assignment !== "All";

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
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />

        <main className="flex-1 px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  Academic setup
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Classes &amp; sections
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Organize every class, section, class teacher, and student count
                  from one place.
                </p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setRefreshKey((value) => value + 1)}
                  disabled={refreshing}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  aria-label="Refresh classes"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setClassName("");
                    setClassModalOpen(true);
                  }}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:flex-none"
                >
                  <Plus className="h-4 w-4" />
                  Add class
                </button>
              </div>
            </header>

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {notice && (
              <div
                role="status"
                className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {notice}
              </div>
            )}

            <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                icon={BookOpen}
                label="Total classes"
                value={classes.length}
                tone="blue"
              />
              <StatCard
                icon={Users}
                label="Total sections"
                value={totalSections}
                tone="violet"
              />
              <StatCard
                icon={GraduationCap}
                label="Total students"
                value={totalStudents}
                tone="emerald"
              />
              <StatCard
                icon={AlertCircle}
                label="Need teachers"
                value={unassignedSections}
                tone="amber"
              />
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="relative w-full sm:max-w-md">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search class, section, or teacher..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1">
                  {(["All", "Assigned", "Unassigned"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAssignment(option)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 ${
                        assignment === option
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {filteredClasses.length === 0 ? (
                <EmptyState
                  filtered={hasFilters}
                  onAdd={() => setClassModalOpen(true)}
                />
              ) : (
                <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">
                  {filteredClasses.map((schoolClass) => (
                    <ClassCard
                      key={schoolClass.id}
                      schoolClass={schoolClass}
                      onAddSection={openAddSection}
                      onEditSection={openEditSection}
                      onDeleteSection={deleteSection}
                      onDeleteClass={deleteClass}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {classModalOpen && (
        <Modal onClose={() => setClassModalOpen(false)} width="max-w-md">
          <form onSubmit={addClass}>
            <ModalHeader
              title="Add a new class"
              description="Create the class first, then add its sections."
              onClose={() => setClassModalOpen(false)}
            />
            <div className="p-6">
              <Field
                label="Class name"
                value={className}
                onChange={setClassName}
                placeholder="For example: Class 7"
                required
              />
            </div>
            <ModalFooter
              submitLabel="Add class"
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

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: "blue" | "violet" | "emerald" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-950 sm:text-2xl">
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function ClassCard({
  schoolClass,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onDeleteClass,
}: {
  schoolClass: SchoolClass;
  onAddSection: (schoolClass: SchoolClass) => void;
  onEditSection: (schoolClass: SchoolClass, section: Section) => void;
  onDeleteSection: (classId: string, section: Section) => void;
  onDeleteClass: (schoolClass: SchoolClass) => void;
}) {
  const totalStudents = schoolClass.sections.reduce(
    (total, section) => total + section.students,
    0,
  );

  return (
    <article className="flex min-h-64 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-slate-950">
            {schoolClass.name}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            <span>{schoolClass.sections.length} sections</span>
            <span aria-hidden="true">·</span>
            <span>{totalStudents} students</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDeleteClass(schoolClass)}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${schoolClass.name}`}
          title="Delete class"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2 p-4">
        {schoolClass.sections.length === 0 ? (
          <div className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center">
            <Users className="h-5 w-5 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              No sections yet
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Add the first section below.
            </p>
          </div>
        ) : (
          schoolClass.sections.map((section) => (
            <div
              key={section.id}
              className="group rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700">
                  {section.name}
                </span>
                <div className="min-w-0 flex-1">
                  {section.teacher ? (
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                        {initials(section.teacher)}
                      </span>
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {section.teacher}
                      </p>
                    </div>
                  ) : (
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Teacher not assigned
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {section.students} students
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditSection(schoolClass, section)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-blue-600"
                    aria-label={`Edit Section ${section.name}`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSection(schoolClass.id, section)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-red-600"
                    aria-label={`Delete Section ${section.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={() => onAddSection(schoolClass)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
        >
          <Plus className="h-4 w-4" />
          Add section
        </button>
      </div>
    </article>
  );
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
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${width}`}
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
