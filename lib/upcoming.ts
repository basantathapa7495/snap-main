export type SchoolEvent = {
  id: string;
  title: string;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  content: string | null;
  category: string | null;
};

export type UpcomingExam = {
  id: string;
  name: string;
  start_date: string | null;
  exam_type: string | null;
};

export type UpcomingItem = {
  id: string;
  sourceId: string;
  source: "event" | "exam";
  date: string;
  time: string | null;
  title: string;
  context: string | null;
  type: string;
  href: string;
};

export function nepalDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function daysFrom(date: string, today: string) {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
}

export function formatEventTime(time: string | null) {
  if (!time) return null;
  const match = time.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return time.trim();
  const hour = Number(match[1]);
  if (hour > 23 || Number(match[2]) > 59) return time.trim();
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? "AM" : "PM"}`;
}

function timeOrder(time: string | null) {
  if (!time) return "00:00";
  const value = time.trim();
  const hours = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hours) return `${hours[1].padStart(2, "0")}:${hours[2]}`;
  const twelve = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!twelve) return "00:00";
  const hour = Number(twelve[1]) % 12 + (twelve[3].toUpperCase() === "PM" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${twelve[2]}`;
}

export function mergeUpcoming(events: SchoolEvent[], exams: UpcomingExam[], today: string): UpcomingItem[] {
  const entries: UpcomingItem[] = [
    ...events.filter((event) => event.event_date && event.event_date >= today).map((event) => {
      const category = event.category?.toLowerCase();
      const type = category === "holiday" ? "Holiday" : category === "meeting" ? "Meeting" : category === "sports" ? "Sports" : "Event";
      return {
        id: `event-${event.id}`, sourceId: event.id, source: "event" as const,
        date: event.event_date!, time: event.event_time, title: event.title,
        context: event.location?.trim() || event.content?.trim() || null,
        type, href: `/principal/calendar?event=${encodeURIComponent(event.id)}`,
      };
    }),
    ...exams.filter((exam) => exam.start_date && exam.start_date >= today).map((exam) => ({
      id: `exam-${exam.id}`, sourceId: exam.id, source: "exam" as const,
      date: exam.start_date!, time: null, title: exam.name,
      context: exam.exam_type?.trim() || null,
      type: "Exam", href: `/principal/results?exam=${encodeURIComponent(exam.id)}`,
    })),
  ];
  return entries.sort((a, b) => a.date.localeCompare(b.date) || timeOrder(a.time).localeCompare(timeOrder(b.time)) || a.title.localeCompare(b.title));
}

export function relativeUpcoming(date: string, today: string) {
  const days = daysFrom(date, today);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === 7) return "In 1 week";
  if (days < 7) return `In ${days} days`;
  return null;
}
