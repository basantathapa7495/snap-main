export type AttendanceStatus = "present" | "absent" | "leave" | "unmarked";
export type AttendanceMark = { student_id: string; attendance_date: string; status: string };

const normalize = (value: string | null | undefined) => (value || "").trim().toLowerCase();

const presentValues = new Set(["present", "late"]);
const leaveValues = new Set(["leave", "on_leave", "on leave", "excused"]);

export function statusOf(rows: AttendanceMark[], studentId: string, date: string): AttendanceStatus {
  const value = normalize(rows.find((row) => row.student_id === studentId && row.attendance_date === date)?.status);
  if (presentValues.has(value)) return "present";
  if (value === "absent") return "absent";
  if (leaveValues.has(value)) return "leave";
  return "unmarked";
}

export function counts(statuses: AttendanceStatus[]) {
  const present = statuses.filter((value) => value === "present").length;
  const absent = statuses.filter((value) => value === "absent").length;
  const leave = statuses.filter((value) => value === "leave").length;
  return { present, absent, leave, total: statuses.length, marked: present + absent + leave };
}

export function markAllPresent<T extends { status: AttendanceStatus; approvedLeave: boolean }>(rows: T[]) {
  return rows.map((row) => row.approvedLeave ? row : { ...row, status: "present" as const });
}

export function trend(rows: AttendanceMark[], studentIds: Set<string>) {
  const byDate = new Map<string, AttendanceStatus[]>();
  for (const row of rows) {
    if (!studentIds.has(row.student_id)) continue;
    const status = statusOf([row], row.student_id, row.attendance_date);
    if (status === "unmarked") continue;
    const list = byDate.get(row.attendance_date) || [];
    list.push(status);
    byDate.set(row.attendance_date, list);
  }
  return [...byDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => {
    const summary = counts(values);
    return { date, ...summary, rate: summary.marked ? Math.round(summary.present / summary.marked * 100) : 0 };
  });
}

export function shiftDate(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}
