export type Mark = { attendance_date: string; status: string; student_id?: string; teacher_id?: string };

export function nepalToday() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function daysBefore(date: string, days: number) {
  const anchor = new Date(`${date}T12:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() - days);
  return anchor.toISOString().slice(0, 10);
}

export function sectionKey(className: string | null, section: string | null) {
  return JSON.stringify([className || '', section || '']);
}

export function attendanceCounts(rows: Mark[], kind: 'student' | 'teacher') {
  const values = rows.filter((row) => kind === 'student'
    ? ['present', 'late', 'absent'].includes(row.status)
    : ['present', 'absent'].includes(row.status));
  const present = values.filter((row) => row.status === 'present').length;
  const late = kind === 'student' ? values.filter((row) => row.status === 'late').length : 0;
  const absent = values.filter((row) => row.status === 'absent').length;
  return { present, late, absent, marked: values.length,
    percentage: values.length ? Math.round(((present + late) / values.length) * 100) : null };
}

export function dailyRates(rows: Mark[], end: string, days: 7 | 14 | 30, kind: 'student' | 'teacher') {
  const byDate = new Map<string, Mark[]>();
  for (const row of rows) {
    if (row.attendance_date < daysBefore(end, days - 1) || row.attendance_date > end) continue;
    const list = byDate.get(row.attendance_date) || [];
    list.push(row);
    byDate.set(row.attendance_date, list);
  }
  const points = Array.from({ length: days }, (_, index) => {
    const date = daysBefore(end, days - index - 1);
    const counts = attendanceCounts(byDate.get(date) || [], kind);
    return { date, label: new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }), rate: counts.percentage };
  });
  const recorded = points.filter((point) => point.rate !== null);
  const average = recorded.length ? Math.round(recorded.reduce((sum, point) => sum + point.rate!, 0) / recorded.length * 10) / 10 : null;
  return { points, average, recordedDays: recorded.length };
}
