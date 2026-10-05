import type { ClassRow, Student } from "./teacher-classes";

const normalize = (value?: string | null) => (value || "").trim().toLowerCase();
const normalizeGrade = (value?: string | null) => normalize(value).replace(/^(class|grade)\s+/, "");
const className = (row: ClassRow) => row.class_name || row.class || row.name || row.class_number || "Class";
const sectionName = (row: ClassRow) => row.section_name || row.section || "";

export type StudentDetail = Student & { gender: string | null; date_of_birth: string | null; dob: string | null; parent_name: string | null; parent_phone: string | null; address: string | null; email: string | null };
export type AttendanceRow = { id: string; student_id: string; attendance_date: string; status: string };
export type Exam = { id: string; name: string; start_date: string; academic_year: number; published_at: string | null };
export type ExamSubject = { id: string; exam_id: string; class_name: string; section: string; subject_name: string; full_marks: number; pass_marks: number };
export type ExamMark = { id: string; subject_id: string; student_id: string; marks: number };

export const belongsToClass = (student: StudentDetail, row: ClassRow) => normalizeGrade(student.class) === normalizeGrade(className(row)) && normalize(student.section) === normalize(sectionName(row));
export function attendanceStatus(rows: AttendanceRow[], studentId: string, date: string) { return normalize(rows.find((r) => r.student_id === studentId && r.attendance_date === date)?.status) || "not marked"; }
export function attendanceRate(rows: AttendanceRow[], studentId: string) { const own = rows.filter((r) => r.student_id === studentId); return own.length ? Math.round((own.filter((r) => ["present", "late"].includes(normalize(r.status))).length / own.length) * 100) : null; }
export function ageOn(dateValue: string | null, now = new Date()) { if (!dateValue) return null; const dob = new Date(`${dateValue.slice(0, 10)}T00:00:00Z`); if (Number.isNaN(dob.getTime())) return null; let age = now.getUTCFullYear() - dob.getUTCFullYear(); if (now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())) age--; return age >= 0 ? age : null; }
export function grade(percent: number | null) { if (percent === null) return "—"; if (percent >= 90) return "A+"; if (percent >= 80) return "A"; if (percent >= 70) return "B+"; if (percent >= 60) return "B"; if (percent >= 50) return "C+"; if (percent >= 40) return "C"; return "NG"; }
