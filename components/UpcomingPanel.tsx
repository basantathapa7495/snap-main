import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight } from "lucide-react";
import { daysFrom, formatEventTime, relativeUpcoming, type UpcomingItem } from "@/lib/upcoming";

function DateBox({ date, today }: { date: string; today: string }) {
  const days = daysFrom(date, today);
  const near = days < 2;
  const month = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  return <span className={`flex h-[54px] w-[54px] shrink-0 flex-col items-center justify-center rounded-xl text-center ${near ? "bg-sky-50 text-blue-700 dark:bg-sky-950/40 dark:text-sky-300" : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"}`}>
    {near ? <span className="text-[9px] font-extrabold tracking-wide">{days === 0 ? "TODAY" : "TOMORROW"}</span> : <><span className="text-[9px] font-extrabold tracking-wide">{month}</span><span className="text-xl font-extrabold leading-5">{date.slice(-2)}</span></>}
  </span>;
}

export function UpcomingRow({ item, today, onEventClick }: { item: UpcomingItem; today: string; onEventClick?: (item: UpcomingItem) => void }) {
  const time = formatEventTime(item.time);
  const detail = [time, item.context].filter(Boolean).join(" · ");
  const relative = relativeUpcoming(item.date, today);
  return <Link href={item.href} onClick={(event) => { if (onEventClick && item.source === "event") { event.preventDefault(); onEventClick(item); } }} className="group flex min-h-[78px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
    <DateBox date={item.date} today={today} />
    <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold leading-4 text-slate-950 dark:text-white">{item.title}</span>{detail && <span className="mt-1 block line-clamp-2 text-[11px] leading-4 text-slate-600 dark:text-slate-300">{detail}</span>}<span className="mt-1.5 flex flex-wrap gap-1"><span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">{item.type}</span>{relative && <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{relative}</span>}</span></span>
    <ChevronRight className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" aria-hidden="true" />
  </Link>;
}

export default function UpcomingPanel({ items, today, className = "mt-5" }: { items: UpcomingItem[]; today: string; className?: string }) {
  const nearest = items.filter((item) => daysFrom(item.date, today) >= 0).slice(0, 3);
  return <section className={`${className} rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5`} aria-label="Upcoming school events">
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-slate-950 dark:text-white sm:text-lg">Upcoming</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Important school events and deadlines</p></div><Link href="/principal/calendar" className="inline-flex min-h-9 shrink-0 items-center rounded-xl bg-blue-50 px-2.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 sm:px-3 sm:text-xs">View calendar</Link></div>
    {nearest.length ? <div className="mt-3 grid gap-2.5">{nearest.map((item) => <UpcomingRow key={item.id} item={item} today={today} />)}</div> : <div className="mt-3 flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><CalendarDays className="h-5 w-5 shrink-0 text-blue-600" /><div><p className="text-sm font-bold text-slate-900 dark:text-white">No upcoming school events</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Nothing important is scheduled in the next 14 days.</p><Link href="/principal/calendar" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300">View calendar <ArrowRight className="h-3.5 w-3.5" /></Link></div></div>}
  </section>;
}
