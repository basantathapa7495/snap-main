"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Layers3,
  Plus,
  GraduationCap,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
  ChevronDown,
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

function matchesSectionOrTeacher(schoolClass: SchoolClass, query: string) {
  return schoolClass.sections.some((section) =>
    normalize(section.name).includes(query) ||
    normalize(`Section ${section.name}`).includes(query) ||
    normalize(section.teacher).includes(query),
  );
}

function matchesClassSearch(schoolClass: SchoolClass, query: string) {
  if (!query) return true;
  const names = [
    schoolClass.name,
    schoolClass.name.replace(/^class\s+/i, "Grade "),
    schoolClass.name.replace(/^grade\s+/i, "Class "),
  ];
  // A single letter such as A should find Section A rather than every "Class".
  const matchesName = names.some((name) => query.length === 1
    ? normalize(name) === query
    : normalize(name).includes(query));
  return matchesName ||
    (schoolClass.sections.length === 0 && normalize(schoolClass.teacher).includes(query)) ||
    matchesSectionOrTeacher(schoolClass, query);
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
  const [search, setSearch] = useState("");
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
  const filteredClasses = useMemo(() => {
    const query = normalize(search);
    return yearClasses.filter((schoolClass) => matchesClassSearch(schoolClass, query));
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
      (schoolClass.sections.length === 0
        ? Number(!schoolClass.teacherId)
        : schoolClass.sections.filter((section) => !section.teacherId).length),
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />

        <main className="flex-1 px-3.5 pb-28 pt-7 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1500px]">
            <header className="relative -mx-3.5 flex min-h-[138px] items-center overflow-hidden bg-gradient-to-br from-[#e7f2ff] via-[#f5faff] to-[#9dbcf4] px-4 py-4 dark:from-[#132a49] dark:via-[#182d49] dark:to-[#1b365b] sm:mx-0 sm:min-h-[190px] sm:rounded-2xl sm:border sm:border-blue-100 sm:px-8 sm:py-8 sm:dark:border-blue-900/60">
              <div className="relative z-10 max-w-[62%]"><h1 className="text-[1.7rem] font-extrabold leading-[1.04] tracking-tight text-slate-950 dark:text-white sm:text-4xl">Classes &amp;<br />Sections</h1><p className="mt-2 max-w-sm text-xs leading-4 text-slate-700 dark:text-blue-100 sm:text-base sm:leading-6">Manage classes, sections and student placement.</p></div>
              <p className="pointer-events-none absolute right-[29%] top-[34%] z-10 hidden -rotate-6 text-center font-serif text-xs italic leading-snug text-blue-900/70 dark:text-blue-200/60 min-[600px]:block lg:text-sm">Empowered<br />Learning,<br />Brighter Futures</p>
              <ClassesHeroArtwork />
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
              <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="text" aria-label="Search class, section or teacher" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search class, section or teacher..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-sm" />{search && <button type="button" onClick={() => { setSearch(""); setExpandedClass(null); }} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>}</div>
              <button type="button" onClick={() => { setError(""); setEditingClass(null); setClassName(""); setClassTeacherId(""); setClassModalOpen(true); }} className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 sm:px-5 sm:text-sm"><Plus className="h-4 w-4" /> Add</button>
            </div>

            <section className="mt-5" aria-label="All classes">
              <div className="mb-2 flex items-end justify-between"><h2 className="text-xl font-extrabold text-slate-950 dark:text-white">All Classes</h2><span className="text-xs text-slate-500 dark:text-slate-400">{filteredClasses.length} classes</span></div>
              {filteredClasses.length === 0 ? <EmptyState filtered={hasFilters} onAdd={() => { setEditingClass(null); setClassName(""); setClassTeacherId(""); setClassModalOpen(true); }} /> :
                <div className="space-y-2.5">{filteredClasses.map((schoolClass) => <div key={schoolClass.id} id={`class-${schoolClass.id}`} className="scroll-mt-24"><ClassCard schoolClass={schoolClass} expanded={(expandedClass === null && filteredClasses[0]?.id === schoolClass.id) || expandedClass === schoolClass.id || (Boolean(search.trim()) && (matchesSectionOrTeacher(schoolClass, normalize(search)) || (schoolClass.sections.length === 0 && normalize(schoolClass.teacher).includes(normalize(search)))))} onToggle={() => setExpandedClass((current) => (current === schoolClass.id || (current === null && filteredClasses[0]?.id === schoolClass.id)) ? "" : schoolClass.id)} showStudents canDelete={isExtraGrade(schoolClass)} onDeleteClass={deleteExtraClass} onAddSection={openAddSection} onEditClass={(item) => { setError(""); setEditingClass(item); setClassName(item.name); setClassTeacherId(item.teacherId || ""); setClassModalOpen(true); }} onEditSection={openEditSection} onDeleteSection={deleteSection} /></div>)}</div>}
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

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number | null; tone: "blue" | "emerald" | "amber" | "rose" }) {
  const tones = { blue: "border-blue-200 text-blue-600 bg-blue-100 dark:border-blue-800 dark:bg-blue-500/20", emerald: "border-emerald-200 text-emerald-600 bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-500/20", amber: "border-amber-200 text-amber-600 bg-amber-100 dark:border-amber-800 dark:bg-amber-500/20", rose: "border-rose-200 text-rose-600 bg-rose-100 dark:border-rose-800 dark:bg-rose-500/20" };
  return <div className={`flex min-w-0 items-center gap-1 rounded-xl border bg-white px-1 py-2 shadow-sm dark:bg-slate-900 sm:gap-3 sm:px-4 sm:py-3 ${tones[tone].split(" ").filter((item) => item.startsWith("border-")).join(" ")}`}>
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 ${tones[tone].split(" ").filter((item) => !item.startsWith("border-")).join(" ")}`}><Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" /></span><span className="min-w-0"><span className="block truncate text-[8px] leading-tight font-medium text-slate-600 dark:text-slate-300 min-[380px]:text-[9px] sm:text-xs">{label}</span><span className="mt-0.5 block text-base font-extrabold leading-none tabular-nums text-slate-950 dark:text-white sm:text-2xl">{value === null ? "—" : value.toLocaleString()}</span></span>
  </div>;
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
  return <article className={`rounded-2xl border bg-white shadow-sm dark:bg-slate-900 ${expanded ? "border-blue-200 dark:border-blue-800" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>
    <button type="button" aria-expanded={expanded} onClick={onToggle} className="flex w-full items-center gap-3 p-3 text-left sm:p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300"><BookOpen className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-slate-950 dark:text-white sm:text-lg">{displayName}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] leading-4 sm:text-xs">
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400" aria-label={showStudents ? `${schoolClass.students} students` : "Students unavailable"} title="Students"><Users className="h-3.5 w-3.5" aria-hidden="true" />{showStudents ? schoolClass.students : "—"}</span>
          {hasSections && <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400" aria-label={`${schoolClass.sections.length} sections`} title="Sections"><Layers3 className="h-3.5 w-3.5" aria-hidden="true" />{schoolClass.sections.length}</span>}
          {hasSections ? schoolClass.sections.map((section) => <span key={section.id} className={`inline-flex min-w-0 items-center gap-1 ${section.teacherId ? "font-medium text-slate-700 dark:text-slate-200" : "font-semibold text-red-600 dark:text-red-400"}`} title={`Section ${section.name}: ${section.teacher || "Not assigned"}`} aria-label={`Section ${section.name} teacher: ${section.teacher || "Not assigned"}`}><GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{section.name}: {section.teacherId ? section.teacher?.trim().split(/\s+/)[0] : "Not assigned"}</span>) : <span className={`inline-flex min-w-0 items-center gap-1 ${schoolClass.teacherId ? "font-medium text-slate-700 dark:text-slate-200" : "font-semibold text-red-600 dark:text-red-400"}`} title={schoolClass.teacher || "Not assigned"}><GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{schoolClass.teacherId ? schoolClass.teacher : "Not assigned"}</span>}
        </span>
      </span>
      <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
    </button>
    {expanded && <div className="space-y-2 px-2.5 pb-3 sm:px-4 sm:pb-4">
      {schoolClass.sections.length === 0 && <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><p className="text-[10px] text-slate-500 dark:text-slate-400">Class Teacher</p><p className={`mt-0.5 text-sm font-semibold ${schoolClass.teacherId ? "text-slate-900 dark:text-white" : "text-rose-600 dark:text-rose-300"}`}>{schoolClass.teacher || "Not assigned"}</p><div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold"><Link href={`/principal/students?class=${encodeURIComponent(schoolClass.name)}`} className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-blue-700 dark:border-blue-700 dark:text-blue-300">View students</Link><button type="button" onClick={() => onEditClass(schoolClass)} className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-blue-700 dark:border-blue-700 dark:text-blue-300">{schoolClass.teacherId ? "Change teacher" : "Assign teacher"}</button><button type="button" onClick={() => onAddSection(schoolClass)} className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-blue-700 dark:border-blue-700 dark:text-blue-300">Add sections</button></div></div>}
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
      {schoolClass.sections.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-semibold"><button type="button" onClick={() => onAddSection(schoolClass)} className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300"><Plus className="h-4 w-4" /> Add section</button><button type="button" onClick={() => onEditClass(schoolClass)} className="text-blue-700 dark:text-blue-300">Edit class</button></div>}
      {canDelete && <button type="button" onClick={() => onDeleteClass(schoolClass)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400"><Trash2 className="h-3.5 w-3.5" /> Delete class</button>}
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
      <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
        {filtered ? "No classes found. Try another class, section or teacher name." : "No classes added yet"}
      </h3>
      {!filtered && <p className="mt-1 text-sm text-slate-500">Add your first class to create the academic structure.</p>}
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

function ClassesHeroArtwork() {
  return <svg viewBox="0 0 360 210" preserveAspectRatio="xMaxYMax meet" className="absolute -bottom-2 -right-5 h-[115%] w-[78%] max-w-none opacity-80 dark:opacity-50 sm:right-0 sm:w-[58%] sm:opacity-100" aria-hidden="true">
    <defs>
      <linearGradient id="teacherBookBlue" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#b9d9ff" /><stop offset="1" stopColor="#2369d0" /></linearGradient>
      <linearGradient id="teacherBookWhite" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#ffffff" /><stop offset="1" stopColor="#d9e7fb" /></linearGradient>
      <linearGradient id="teacherPot" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#d1e3fa" /></linearGradient>
      <linearGradient id="teacherLeaf" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#64bf6a" /><stop offset="1" stopColor="#167240" /></linearGradient>
    </defs>
    <ellipse cx="231" cy="199" rx="126" ry="8" fill="#4780b6" opacity=".16" />
    <path d="M302 142c-4-29-6-47-1-73m0 73c6-19 20-40 39-55m-38 53c-11-18-25-30-43-40" fill="none" stroke="#29834b" strokeWidth="3" />
    <path d="M297 96c-21-34-15-61 7-83 11 36 6 62-7 83Z" fill="url(#teacherLeaf)" />
    <path d="M306 104c9-31 28-47 49-50-6 27-23 45-49 50Z" fill="#319655" />
    <path d="M297 121c-9-24-25-38-47-40 11 26 26 39 47 40Z" fill="#368d50" />
    <path d="M306 124c13-21 32-31 52-27-13 20-29 29-52 27Z" fill="#459f56" />
    <path d="M279 132h55l-6 49c-2 5-8 7-22 7s-21-2-22-7l-5-49Z" fill="url(#teacherPot)" stroke="#bdd4ed" strokeWidth="2" />
    <path d="M278 133h57" stroke="#f9fcff" strokeWidth="5" strokeLinecap="round" />
    <rect x="143" y="93" width="19" height="73" rx="3" fill="#3579d8" /><rect x="147" y="97" width="4" height="57" fill="#7bb3f3" opacity=".65" />
    <rect x="164" y="88" width="20" height="78" rx="3" fill="#84b7ec" /><rect x="167" y="92" width="3" height="56" fill="#dceeff" opacity=".8" />
    <rect x="187" y="100" width="15" height="66" rx="2" fill="#1c59a8" /><rect x="190" y="104" width="3" height="50" fill="#c8e3ff" opacity=".65" />
    <rect x="205" y="95" width="19" height="71" rx="2" fill="#4a83cc" /><rect x="209" y="98" width="4" height="59" fill="#d5ebff" opacity=".7" />
    <rect x="223" y="105" width="11" height="62" rx="2" fill="#dbad6e" />
    <path d="M88 108 81 52m18 55L101 45m11 63 10-57" stroke="#233f67" strokeWidth="5" strokeLinecap="round" />
    <path d="m79 50 1-11 3 11m16-6 2-12 3 12m16 5 4-10 1 11" fill="#20477b" />
    <path d="M62 112h68l-7 73c-1 4-7 6-27 6s-26-2-27-6l-7-73Z" fill="url(#teacherPot)" stroke="#bcd4ec" strokeWidth="2" />
    <path d="M62 113h68" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    <path d="M132 170h205l-5 27H130l2-27Z" fill="#3373c4" />
    <path d="M136 171h195l-4 21H134l2-21Z" fill="url(#teacherBookWhite)" />
    <path d="M132 170h205" stroke="#86ace0" strokeWidth="5" strokeLinecap="round" />
    <path d="M128 143h211l-3 27H125l3-27Z" fill="#2c68b6" />
    <path d="M130 146h204l-3 19H127l3-19Z" fill="url(#teacherBookWhite)" />
    <path d="M127 143h211" stroke="#87b7eb" strokeWidth="5" strokeLinecap="round" />
    <path d="M135 170h198" stroke="#4b8ce0" strokeWidth="2" />
    <path d="M139 194h191" stroke="#164a93" strokeWidth="3" />
  </svg>;
}
