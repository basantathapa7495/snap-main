"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";

type Section = {
  id: string;
  name: string;
  teacher: string | null;
  students: number;
};

type SchoolClass = {
  id: string;
  name: string;
  sections: Section[];
};

type SectionForm = {
  name: string;
  teacher: string;
  students: string;
};

const initialClasses: SchoolClass[] = [
  {
    id: "class-1",
    name: "Class 1",
    sections: [
      { id: "class-1-a", name: "A", teacher: "Sita Poudel", students: 28 },
      { id: "class-1-b", name: "B", teacher: "Ram Sharma", students: 25 },
    ],
  },
  {
    id: "class-2",
    name: "Class 2",
    sections: [
      { id: "class-2-a", name: "A", teacher: "Gita Rai", students: 31 },
      { id: "class-2-b", name: "B", teacher: null, students: 24 },
    ],
  },
  {
    id: "class-3",
    name: "Class 3",
    sections: [
      { id: "class-3-a", name: "A", teacher: "Hari Thapa", students: 29 },
    ],
  },
  {
    id: "class-4",
    name: "Class 4",
    sections: [
      { id: "class-4-a", name: "A", teacher: "Bishnu K.C.", students: 30 },
      { id: "class-4-b", name: "B", teacher: null, students: 22 },
    ],
  },
  {
    id: "class-5",
    name: "Class 5",
    sections: [
      { id: "class-5-a", name: "A", teacher: "Sita Poudel", students: 32 },
      { id: "class-5-b", name: "B", teacher: "Ram Sharma", students: 27 },
    ],
  },
  {
    id: "class-6",
    name: "Class 6",
    sections: [
      { id: "class-6-a", name: "A", teacher: "Gita Rai", students: 34 },
    ],
  },
];

const emptySection: SectionForm = {
  name: "",
  teacher: "",
  students: "",
};

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
  const [classes, setClasses] = useState<SchoolClass[]>(initialClasses);
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

  function addClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = titleCase(className);
    if (!name) return;

    if (
      classes.some(
        (schoolClass) => schoolClass.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      showNotice("A class with this name already exists.");
      return;
    }

    setClasses((current) => [
      ...current,
      { id: crypto.randomUUID(), name, sections: [] },
    ]);
    setClassName("");
    setClassModalOpen(false);
    showNotice(`${name} added successfully.`);
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
      teacher: section.teacher || "",
      students: String(section.students),
    });
  }

  function saveSection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeClass || !sectionForm.name.trim()) return;

    const nextSection = {
      id: editingSection?.id || crypto.randomUUID(),
      name: sectionForm.name.trim().toUpperCase(),
      teacher: sectionForm.teacher.trim()
        ? titleCase(sectionForm.teacher)
        : null,
      students: Math.max(0, Number(sectionForm.students) || 0),
    };

    setClasses((current) =>
      current.map((schoolClass) => {
        if (schoolClass.id !== activeClass.id) return schoolClass;
        return {
          ...schoolClass,
          sections: editingSection
            ? schoolClass.sections.map((section) =>
                section.id === editingSection.id ? nextSection : section,
              )
            : [...schoolClass.sections, nextSection],
        };
      }),
    );

    setActiveClass(null);
    setEditingSection(null);
    setSectionForm(emptySection);
    showNotice(
      editingSection ? "Section updated successfully." : "Section added successfully.",
    );
  }

  function deleteSection(classId: string, section: Section) {
    if (!window.confirm(`Delete Section ${section.name}?`)) return;
    setClasses((current) =>
      current.map((schoolClass) =>
        schoolClass.id === classId
          ? {
              ...schoolClass,
              sections: schoolClass.sections.filter(
                (item) => item.id !== section.id,
              ),
            }
          : schoolClass,
      ),
    );
    showNotice("Section deleted.");
  }

  function deleteClass(schoolClass: SchoolClass) {
    if (
      !window.confirm(
        `Delete ${schoolClass.name} and all of its sections? This cannot be undone.`,
      )
    )
      return;
    setClasses((current) =>
      current.filter((item) => item.id !== schoolClass.id),
    );
    showNotice(`${schoolClass.name} deleted.`);
  }

  const hasFilters = Boolean(search.trim()) || assignment !== "All";

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
              <button
                type="button"
                onClick={() => {
                  setClassName("");
                  setClassModalOpen(true);
                }}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Add class
              </button>
            </header>

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
              <Field
                label="Student count"
                value={sectionForm.students}
                onChange={(value) =>
                  setSectionForm((current) => ({ ...current, students: value }))
                }
                placeholder="0"
                type="number"
              />
              <div className="sm:col-span-2">
                <Field
                  label="Class teacher"
                  value={sectionForm.teacher}
                  onChange={(value) =>
                    setSectionForm((current) => ({ ...current, teacher: value }))
                  }
                  placeholder="Leave empty if not assigned"
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
