export type ClassRow = {
  id: string;
  school_id: string;
  class_name: string | null;
  class: string | null;
  name: string | null;
  class_number: string | null;
  section_name: string | null;
  section: string | null;
  academic_year: number;
  archived_at: string | null;
};
export type Assignment = {
  id: string;
  class_id: string | null;
  class_name: string;
  subject: string;
  period_id: string | null;
  weekday: number | null;
  periods_per_week: number;
  academic_year: string | null;
};
export type Period = {
  id: string;
  name: string;
  kind: string;
  position: number;
  start_time: string | null;
  end_time: string | null;
  academic_year: number;
};
export type Student = {
  id: string;
  name: string;
  class: string;
  section: string | null;
  roll_no: string | null;
};
export type Slot = {
  id: string;
  classId: string;
  label: string;
  subject: string;
  weekday: number;
  start: string | null;
  end: string | null;
  period: string;
  position: number;
  room: string | null;
};
export type LegacySlot = {
  id: string;
  class_name: string;
  subject: string;
  weekday: number;
  start_time: string;
  end_time: string;
  room: string | null;
};
export const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const normalize = (value?: string | null) =>
  (value || "").trim().toLowerCase();
export const normalizeGrade = (value?: string | null) =>
  normalize(value).replace(/^(class|grade)\s+/, "");
export const className = (row: ClassRow) =>
  row.class_name || row.class || row.name || row.class_number || "Class";
export const sectionName = (row: ClassRow) =>
  row.section_name || row.section || "";
export const classLabel = (row: ClassRow) =>
  `${className(row).replace(/^Class\s+/i, "Grade ")}${sectionName(row) ? ` ${sectionName(row)}` : ""}`;
export const matchesStudent = (student: Student, row: ClassRow) =>
  normalizeGrade(student.class) === normalizeGrade(className(row)) &&
  normalize(student.section) === normalize(sectionName(row));
export function nepalClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  return {
    date,
    weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}
export const minutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
export function timeLabel(time: string | null) {
  if (!time) return "Time not set";
  const hour = Number(time.slice(0, 2));
  return `${hour % 12 || 12}:${time.slice(3, 5)} ${hour >= 12 ? "PM" : "AM"}`;
}
export function slotStatus(slot: Slot, clock: ReturnType<typeof nepalClock>) {
  if (!slot.start || !slot.end) return "Time not set";
  return clock.minutes >= minutes(slot.end)
    ? "Completed"
    : clock.minutes >= minutes(slot.start)
      ? "Now"
      : "Upcoming";
}
export function buildSchedule(
  classes: ClassRow[],
  assignments: Assignment[],
  periods: Period[],
  legacy: LegacySlot[],
) {
  const slots: Slot[] = [];
  for (const a of assignments) {
    const row = classes.find((c) => c.id === a.class_id);
    const period = periods.find(
      (p) =>
        p.id === a.period_id &&
        p.academic_year === row?.academic_year &&
        p.kind === "lesson",
    );
    if (!row || !period) continue;
    // Existing assignment editor defines a null weekday as every school day (Sun–Fri).
    for (const weekday of a.weekday === null
      ? [0, 1, 2, 3, 4, 5]
      : [a.weekday]) {
      slots.push({
        id: `${a.id}-${weekday}`,
        classId: row.id,
        label: classLabel(row),
        subject: a.subject,
        weekday,
        start: period.start_time,
        end: period.end_time,
        period: period.name,
        position: period.position,
        room: null,
      });
    }
  }
  for (const e of legacy) {
    // Legacy labels lack class IDs. Resolve only unambiguous assigned class/subject pairs.
    const candidates = classes.filter(
      (c) =>
        [
          classLabel(c),
          `${className(c)} ${sectionName(c)}`.trim(),
          ...(!sectionName(c) ? [className(c)] : []),
        ].some(
          (label) => normalizeGrade(label) === normalizeGrade(e.class_name),
        ) &&
        assignments.some(
          (a) =>
            a.class_id === c.id &&
            normalize(a.subject) === normalize(e.subject),
        ),
    );
    if (
      candidates.length !== 1 ||
      slots.some(
        (s) =>
          s.classId === candidates[0].id &&
          normalize(s.subject) === normalize(e.subject),
      )
    )
      continue;
    const row = candidates[0];
    slots.push({
      id: e.id,
      classId: row.id,
      label: classLabel(row),
      subject: e.subject,
      weekday: e.weekday,
      start: e.start_time,
      end: e.end_time,
      period: "Class period",
      position: 0,
      room: e.room,
    });
  }
  return slots.sort(
    (a, b) =>
      a.weekday - b.weekday ||
      (a.start || "99").localeCompare(b.start || "99") ||
      a.position - b.position,
  );
}
export function nextSlot(slots: Slot[], clock: ReturnType<typeof nepalClock>) {
  return (
    slots
      .filter((s) => s.start)
      .map((s) => {
        let days = (s.weekday - clock.weekday + 7) % 7;
        if (!days && minutes(s.start!) <= clock.minutes) days = 7;
        return {
          slot: s,
          days,
          distance: days * 1440 + minutes(s.start!) - clock.minutes,
        };
      })
      .sort((a, b) => a.distance - b.distance)[0] || null
  );
}
export function nextLabel(next: ReturnType<typeof nextSlot>) {
  return next
    ? `${next.days === 0 ? "Today" : next.days === 1 ? "Tomorrow" : weekdays[next.slot.weekday]}, ${timeLabel(next.slot.start)}`
    : "No upcoming period scheduled";
}
