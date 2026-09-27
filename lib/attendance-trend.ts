export type StudentEnrollment = { id: string; class: string | null };
export type StudentMark = { student_id: string | null; attendance_date: string; status: string };
export type StaffMark = { teacher_id: string; attendance_date: string; status: string };
export type ApprovedLeave = { teacher_id: string; start_date: string; end_date: string };
export type TrendPoint = { date: string; day: string; students: number | null; staff: number | null };
export type TrendSummary = { percentage: number | null; present: number; expected: number; recorded: number; total: number; inProgress: boolean };

const rounded = (present: number, expected: number) => expected ? Math.round(present / expected * 1000) / 10 : null;

export function attendanceTrendData({ today, students, studentMarks, teacherIds, staffMarks, approvedLeaves, holidays }: {
  today: string; students: StudentEnrollment[]; studentMarks: StudentMark[]; teacherIds: string[];
  staffMarks: StaffMark[]; approvedLeaves: ApprovedLeave[]; holidays: string[];
}) {
  const holidayDates = new Set(holidays);
  const enrolled = new Map(students.map((student) => [student.id, student]));
  // The attendance module records attendance by class (sections belong to the class).
  const classes = new Set(students.map((student) => student.class).filter((value): value is string => Boolean(value)));
  const activeStaff = new Set(teacherIds);
  const dates = new Set<string>();
  const studentsByDate = new Map<string, Map<string, string>>();
  const staffByDate = new Map<string, Map<string, string>>();
  for (const row of studentMarks) {
    if (!row.student_id || !enrolled.has(row.student_id) || row.attendance_date > today) continue;
    if (!['present', 'late', 'absent'].includes(row.status)) continue;
    dates.add(row.attendance_date);
    if (!studentsByDate.has(row.attendance_date)) studentsByDate.set(row.attendance_date, new Map());
    studentsByDate.get(row.attendance_date)!.set(row.student_id, row.status);
  }
  for (const row of staffMarks) {
    if (!activeStaff.has(row.teacher_id) || row.attendance_date > today) continue;
    if (!['present', 'absent', 'leave', 'holiday'].includes(row.status)) continue;
    dates.add(row.attendance_date);
    if (!staffByDate.has(row.attendance_date)) staffByDate.set(row.attendance_date, new Map());
    staffByDate.get(row.attendance_date)!.set(row.teacher_id, row.status);
  }
  function summary(date: string) {
    const holiday = holidayDates.has(date);
    const studentRows = studentsByDate.get(date) || new Map<string, string>();
    const recordedClasses = new Set([...studentRows.keys()].map((id) => enrolled.get(id)?.class).filter(Boolean));
    const completed = classes.size > 0 && recordedClasses.size === classes.size && students.length > 0 && students.every((student) => studentRows.has(student.id));
    const studentPresent = [...studentRows.values()].filter((status) => status === 'present' || status === 'late').length;
    const student: TrendSummary = {
      percentage: !holiday && completed ? rounded(studentPresent, students.length) : null,
      present: studentPresent, expected: students.length, recorded: recordedClasses.size,
      total: classes.size, inProgress: !holiday && studentRows.size > 0 && !completed,
    };
    const staffRows = staffByDate.get(date) || new Map<string, string>();
    const onLeave = new Set(approvedLeaves.filter((leave) => leave.start_date <= date && leave.end_date >= date).map((leave) => leave.teacher_id));
    // An explicitly corrected attendance status takes precedence over an approved leave.
    const expectedIds = teacherIds.filter((id) => {
      const saved = staffRows.get(id);
      return saved !== 'holiday' && saved !== 'leave' && !(onLeave.has(id) && !saved);
    });
    const staffPresent = expectedIds.filter((id) => staffRows.get(id) === 'present').length;
    const staffComplete = expectedIds.length > 0 && expectedIds.every((id) => ['present', 'absent'].includes(staffRows.get(id) || ''));
    const staff: TrendSummary = {
      percentage: !holiday && staffComplete ? rounded(staffPresent, expectedIds.length) : null,
      present: staffPresent, expected: expectedIds.length,
      recorded: expectedIds.filter((id) => ['present', 'absent'].includes(staffRows.get(id) || '')).length,
      total: teacherIds.length, inProgress: !holiday && staffRows.size > 0 && !staffComplete,
    };
    return { student, staff };
  }
  const { student: todayStudent, staff: todayStaff } = summary(today);
  const points: TrendPoint[] = [...dates].sort().filter((date) => !holidayDates.has(date)).map((date) => {
    const { student, staff } = summary(date);
    return { date, day: new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      students: student.percentage, staff: staff.percentage };
  }).filter((point) => point.students !== null || point.staff !== null).slice(-30);
  return { points, todayStudent, todayStaff };
}
