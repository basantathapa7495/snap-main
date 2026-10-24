"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Plus,
  GraduationCap,
  Trash2,
  Users,
  X,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
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
  const [defaultHighestGrade, setDefaultHighestGrade] = useState<number | null>(null);
  const [authenticated, setAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const currentYear = Number(new NepaliDate(new Date()).format("YYYY"));
  const selectedYear = currentYear;
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [className, setClassName] = useState("");
  const [classTeacherId, setClassTeacherId] = useState("");
  const [activeClass, setActiveClass] = useState<SchoolClass | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionForm, setSectionForm] =
    useState<SectionForm>(emptySection);
  const [creatingSections, setCreatingSections] = useState(false);
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

        const [classesResult, teachersResult, studentsResult, schoolResult] =
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
            supabase
              .from("schools")
              .select("school_level, highest_grade")
              .eq("id", profile.school_id)
              .single(),
          ]);

        if (classesResult.error) throw classesResult.error;
        if (teachersResult.error) throw teachersResult.error;
        if (studentsResult.error) throw studentsResult.error;
        if (schoolResult.error) throw schoolResult.error;

        if (!cancelled) {
          const teacherRows = (teachersResult.data || []) as Teacher[];
          const classRows = (classesResult.data || []) as ClassRow[];
          const schoolClasses = buildClasses(classRows, teacherRows, (studentsResult.data || []) as StudentRow[]);
          const linkedId = new URLSearchParams(window.location.search).get('class');
          const linkedRow = classRows.find((row) => row.id === linkedId);
          const linkedClass = linkedRow && schoolClasses.find((item) => normalize(item.name) === normalize(classLabel(linkedRow)));
          if (linkedClass) window.history.replaceState(window.history.state, '', `/principal/classes#class-${linkedClass.id}`);
          setSchoolId(profile.school_id);
          const level = schoolResult.data.school_level;
          setDefaultHighestGrade(level === "Primary" ? 5 : level === "Basic" ? 8 : level === "Secondary" ? (schoolResult.data.highest_grade === 12 ? 12 : 10) : level === "Higher Secondary" ? 12 : null);
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
  const filteredClasses = yearClasses;
  const totalStudents = yearClasses.reduce(
    (total, schoolClass) => total + schoolClass.students,
    0,
  );

  function assignedElsewhere(teacherId: string, currentRowId?: string) {
    if (!teacherId) return null;
    for (const schoolClass of yearClasses) {
      const assignments = schoolClass.sections.length > 0
        ? schoolClass.sections.map((section) => ({ ...section, label: `${schoolClass.name} · Section ${section.name}` }))
        : [{ id: schoolClass.id, teacherId: schoolClass.teacherId, label: schoolClass.name }];
      const match = assignments.find((item) => item.teacherId === teacherId && item.id !== currentRowId);
      if (match) return match.label;
    }
    return null;
  }

  function teacherOptions(currentRowId?: string) {
    return teachers.map((teacher) => ({
      ...teacher,
      assignment: assignedElsewhere(teacher.id, currentRowId),
    }));
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  function isExtraGrade(schoolClass: SchoolClass) {
    const match = /^(?:class|grade)\s+(\d+)$/i.exec(schoolClass.name.trim());
    return defaultHighestGrade !== null && Boolean(match) && Number(match![1]) > defaultHighestGrade;
  }

  async function deleteExtraClass(schoolClass: SchoolClass) {
    if (!schoolId || !isExtraGrade(schoolClass)) return;
    if (schoolClass.students > 0) {
      setError("Move students out of this class before deleting it.");
      return;
    }
    if (!window.confirm(`Delete ${schoolClass.name}? It will be removed from active classes while its history is preserved.`)) return;
    setError("");
    const ids = [schoolClass.id, ...schoolClass.sections.map((section) => section.id)];
    const [studentsResult, assignmentsResult, documentsResult] = await Promise.all([
      supabase.from("students").select("class").eq("school_id", schoolId),
      supabase.from("teacher_assignments").select("class_id").in("class_id", ids).limit(1),
      supabase.from("document_target_classes").select("class_id").in("class_id", ids).limit(1),
    ]);
    const checkError = studentsResult.error || assignmentsResult.error || documentsResult.error;
    if (checkError) { setError(checkError.message); return; }
    const plainName = schoolClass.name.replace(/^(?:class|grade)\s+/i, "");
    if (studentsResult.data?.some((student) => [schoolClass.name, plainName].some((name) => normalize(student.class) === normalize(name)))) {
      setError("Move students out of this class before deleting it.");
      return;
    }
    if (assignmentsResult.data?.length || documentsResult.data?.length) {
      setError("Remove teacher assignments and document targets for this class before deleting it.");
      return;
    }
    const { data: archivedRows, error: archiveError } = await supabase.from("classes")
      .update({ archived_at: new Date().toISOString() })
      .eq("school_id", schoolId)
      .eq("academic_year", schoolClass.academicYear)
      .is("archived_at", null)
      .in("id", ids)
      .select("id");
    if (archiveError) { setError(archiveError.message); return; }
    if (archivedRows?.length !== new Set(ids).size) {
      setError("The class could not be fully removed. Refresh and try again.");
      setRefreshKey((value) => value + 1);
      return;
    }
    showNotice(`${schoolClass.name} removed from active classes.`);
    setRefreshKey((value) => value + 1);
  }

  async function saveClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = titleCase(className);
    if (!schoolId || !name) return;
    if ((!editingClass || editingClass.sections.length === 0) && classTeacherId && !teachers.some((teacher) => teacher.id === classTeacherId)) {
      setError("Select a teacher from this school.");
      return;
    }
    const existingAssignment = (!editingClass || editingClass.sections.length === 0) && assignedElsewhere(classTeacherId, editingClass?.id);
    if (existingAssignment) {
      setError(`This teacher is already assigned to ${existingAssignment}. Choose another teacher.`);
      return;
    }

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
      ...(editingClass?.sections.length ? {} : { teacher_id: classTeacherId || null }),
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

  async function openAddSection(schoolClass: SchoolClass) {
    if (!schoolId || creatingSections) return;
    if (schoolClass.sections.length === 0) {
      setCreatingSections(true);
      setError("");
      const base = {
        school_id: schoolId,
        academic_year: schoolClass.academicYear,
        class_name: schoolClass.name,
        name: schoolClass.name,
        class_number: schoolClass.name.replace(/^Class\s+/i, "").trim() || null,
      };
      // A single insert keeps the pair together; neither students nor the class row are changed.
      const { error: insertError } = await supabase.from("classes").insert([
        { ...base, section: "A", section_name: "A", teacher_id: schoolClass.teacherId },
        { ...base, section: "B", section_name: "B", teacher_id: null },
      ]);
      setCreatingSections(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      showNotice("Sections A and B added. Students remain in their current placement.");
      setRefreshKey((value) => value + 1);
      return;
    }
    setActiveClass(schoolClass);
    setEditingSection(null);
    const used = new Set(schoolClass.sections.map((section) => normalize(section.name)));
    const next = "CDEFGHIJKLMNOPQRSTUVWXYZ".split("").find((letter) => !used.has(normalize(letter))) || "";
    setSectionForm({ name: next, teacherId: "" });
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
    if (sectionForm.teacherId && !teachers.some((teacher) => teacher.id === sectionForm.teacherId)) {
      setError("Select a teacher from this school.");
      return;
    }
    const existingAssignment = assignedElsewhere(sectionForm.teacherId, editingSection?.id);
    if (existingAssignment) {
      setError(`This teacher is already assigned to ${existingAssignment}. Choose another teacher.`);
      return;
    }

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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-[55px] lg:ml-64 lg:pt-10">
        <div className="hidden lg:block">
          <TopBar />
        </div>

        <main className="flex-1 px-3 pb-28 pt-0 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1500px]">
            <section className="relative -mx-3 aspect-[1672/650] w-[calc(100%+1.5rem)] overflow-hidden bg-[#edf7ff] sm:mx-0 sm:w-full sm:rounded-2xl sm:border sm:border-blue-100 sm:shadow-sm">
              <Image
                src="/class.jpg"
                alt="Classes and sections"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, calc(100vw - 16rem)"
                className="object-cover object-center"
              />
            </section>

            {error && <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
            {notice && <div role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"><CheckCircle2 className="h-4 w-4 shrink-0" />{notice}</div>}

            <section className="mt-3" aria-label="Class list">
              <div className="mb-4 flex items-end justify-between gap-4">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Class List</h1>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Students</p>
                  <p className="mt-0.5 text-2xl font-extrabold leading-none tabular-nums text-slate-950 dark:text-white">{totalStudents.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {filteredClasses.map((schoolClass) => {
                  const expanded = expandedClass === schoolClass.id;
                  return (
                    <div key={schoolClass.id} id={`class-${schoolClass.id}`} className={`scroll-mt-24 ${expanded ? "col-span-2 lg:col-span-3 xl:col-span-4" : ""}`}>
                      <ClassCard
                        schoolClass={schoolClass}
                        expanded={expanded}
                        onToggle={() => setExpandedClass((current) => current === schoolClass.id ? null : schoolClass.id)}
                        showStudents
                        canDelete={isExtraGrade(schoolClass)}
                        onDeleteClass={deleteExtraClass}
                        onAddSection={openAddSection}
                        onEditClass={(item) => {
                          setError("");
                          setEditingClass(item);
                          setClassName(item.name);
                          setClassTeacherId(item.teacherId || "");
                          setClassModalOpen(true);
                        }}
                        onEditSection={openEditSection}
                        onDeleteSection={deleteSection}
                      />
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setEditingClass(null);
                    setClassName("");
                    setClassTeacherId("");
                    setClassModalOpen(true);
                  }}
                  className="flex min-h-[112px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-slate-500 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-current">
                    <Plus className="h-5 w-5" />
                  </span>
                  <span className="mt-2 text-xs font-bold sm:text-sm">Add Class</span>
                </button>
              </div>
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
                  ? editingClass.sections.length === 0
                    ? "Update the class name or assigned class teacher."
                    : "Update the class name. Teachers are assigned to sections."
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
              {(!editingClass || editingClass.sections.length === 0) && <SelectField
                label="Class teacher"
                value={classTeacherId}
                onChange={setClassTeacherId}
                options={teacherOptions(editingClass?.id)}
              />}
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
                  options={teacherOptions(editingSection?.id)}
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

function ClassCard({ schoolClass, expanded, onToggle, showStudents, canDelete, onDeleteClass, onAddSection, onEditClass, onEditSection, onDeleteSection }: {
  schoolClass: SchoolClass; expanded: boolean; onToggle: () => void; showStudents: boolean; canDelete: boolean;
  onDeleteClass: (schoolClass: SchoolClass) => void;
  onAddSection: (schoolClass: SchoolClass) => void;
  onEditClass: (schoolClass: SchoolClass) => void;
  onEditSection: (schoolClass: SchoolClass, section: Section) => void;
  onDeleteSection: (classId: string, section: Section) => void;
}) {
  const displayName = schoolClass.name.replace(/^Class\s+(\d+)$/i, "Grade $1");
  const hasSections = schoolClass.sections.length > 0;
  const gradeMatch = /^(?:Class|Grade)\s+(\d+)$/i.exec(schoolClass.name.trim());
  const gradeNumber = gradeMatch ? Number(gradeMatch[1]) : null;
  const classImage = gradeNumber && gradeNumber >= 1 && gradeNumber <= 10
    ? `/class${gradeNumber}.png`
    : null;

  return (
    <article className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition dark:bg-slate-900 ${expanded ? "border-blue-200 dark:border-blue-800" : "border-slate-200 dark:border-slate-700"}`}>
      <button type="button" aria-expanded={expanded} onClick={onToggle} className="relative min-h-[112px] w-full px-3 pb-3 pt-2 text-left sm:min-h-[128px] sm:px-4 sm:pb-4 sm:pt-3">
        <span className="block max-w-[60%] truncate text-sm font-extrabold text-slate-950 dark:text-white sm:text-lg">{displayName}</span>
        <span className="mt-0.5 block text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">
          {showStudents ? `${schoolClass.students} Students` : "Students unavailable"}
        </span>

        <span className="absolute right-1.5 top-1.5 h-[66px] w-[50%] overflow-hidden sm:right-2 sm:top-2 sm:h-[78px]">
          {classImage ? (
            <Image
              src={classImage}
              alt=""
              fill
              sizes="(max-width: 767px) 45vw, 260px"
              className="object-contain object-center"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-[45%] bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
              <BookOpen className="h-9 w-9" aria-hidden="true" />
            </span>
          )}
        </span>

        {hasSections ? (
          <span className="absolute inset-x-3 bottom-2.5 sm:inset-x-4 sm:bottom-3">
            <span className="block text-[10px] font-medium leading-none text-slate-500 dark:text-slate-400">Sections</span>
            <span className="mt-1 flex items-center gap-1">
              {schoolClass.sections.slice(0, 4).map((section) => (
                <span key={section.id} className="flex h-6 min-w-7 items-center justify-center rounded-full bg-blue-50 px-1.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {section.name}
                </span>
              ))}
              {schoolClass.sections.length > 4 && <span className="text-xs font-bold text-slate-500">+{schoolClass.sections.length - 4}</span>}
              <span className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : "-rotate-90"}`} />
              </span>
            </span>
          </span>
        ) : (
          <span className="absolute bottom-2.5 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:bottom-3 sm:right-4">
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : "-rotate-90"}`} />
          </span>
        )}
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-slate-100 px-3 pb-4 pt-3 dark:border-slate-800 sm:px-4">
          {!hasSections && (
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Class Teacher</p>
              <p className={`mt-0.5 text-sm font-semibold ${schoolClass.teacherId ? "text-slate-900 dark:text-white" : "text-rose-600 dark:text-rose-300"}`}>{schoolClass.teacher || "Not assigned"}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                {showStudents && <Link href={`/principal/students?class=${encodeURIComponent(schoolClass.name)}`} className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-blue-700 dark:border-blue-700 dark:text-blue-300">View students</Link>}
                <button type="button" onClick={() => onEditClass(schoolClass)} className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-blue-700 dark:border-blue-700 dark:text-blue-300">{schoolClass.teacherId ? "Change teacher" : "Assign teacher"}</button>
                <button type="button" onClick={() => onAddSection(schoolClass)} className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-blue-700 dark:border-blue-700 dark:text-blue-300">Add sections</button>
              </div>
            </div>
          )}

          {schoolClass.sections.map((section) => (
            <div key={section.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{section.name.slice(0, 2)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-950 dark:text-white">Section {section.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{showStudents ? `${section.students} students` : "Students unavailable"}</p>
                </div>
                <div className="min-w-0 flex-1 border-l border-slate-200 pl-3 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Class Teacher</p>
                  <p className={`truncate text-xs font-semibold ${section.teacher ? "text-slate-800 dark:text-slate-100" : "text-rose-600 dark:text-rose-300"}`}>{section.teacher || "Not assigned"}</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 pl-[52px] text-[11px] font-semibold sm:text-xs">
                {showStudents && <Link href={`/principal/students?class=${encodeURIComponent(schoolClass.name)}&section=${encodeURIComponent(section.name)}`} className="rounded-lg border border-blue-200 px-2 py-1.5 text-blue-700 dark:border-blue-700 dark:text-blue-300">View students</Link>}
                <button type="button" onClick={() => onEditSection(schoolClass, section)} className="rounded-lg border border-blue-200 px-2 py-1.5 text-blue-700 dark:border-blue-700 dark:text-blue-300">Edit</button>
                <button type="button" onClick={() => onDeleteSection(schoolClass.id, section)} className="rounded-lg px-2 py-1.5 text-rose-600 dark:text-rose-300">Archive</button>
              </div>
            </div>
          ))}

          {hasSections && (
            <div className="flex items-center justify-between gap-2 pt-1 text-xs font-semibold">
              <button type="button" onClick={() => onAddSection(schoolClass)} className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300"><Plus className="h-4 w-4" /> Add section</button>
              <button type="button" onClick={() => onEditClass(schoolClass)} className="text-blue-700 dark:text-blue-300">Edit class</button>
            </div>
          )}
          {canDelete && <button type="button" onClick={() => onDeleteClass(schoolClass)} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400"><Trash2 className="h-3.5 w-3.5" /> Delete class</button>}
        </div>
      )}
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
  options: (Teacher & { assignment?: string | null })[];
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
          <option key={teacher.id} value={teacher.id} disabled={Boolean(teacher.assignment)}>{teacher.name}{teacher.assignment ? ` — ${teacher.assignment}` : ""}</option>
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

function ClassesSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pt-[55px] lg:ml-64 lg:pt-10">
        <div className="hidden lg:block">
          <TopBar />
        </div>
        <main className="px-3 pb-24 pt-0 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1500px] animate-pulse">
            <div className="-mx-3 aspect-[1672/650] w-[calc(100%+1.5rem)] bg-slate-100 sm:mx-0 sm:w-full sm:rounded-2xl" />
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
