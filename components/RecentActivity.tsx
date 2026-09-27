import Link from 'next/link';
import { CalendarDays, ChevronRight, FileText, Inbox, Megaphone, ReceiptText, UserPlus, Users, ClipboardCheck, type LucideIcon } from 'lucide-react';
import type { ActivityKind, SchoolActivity } from '@/lib/recent-activity';

const iconStyles: Record<ActivityKind, { icon: LucideIcon; tone: string }> = {
  fee: { icon: ReceiptText, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' },
  notice: { icon: Megaphone, tone: 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300' },
  admission: { icon: UserPlus, tone: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' },
  document: { icon: FileText, tone: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300' },
  student: { icon: UserPlus, tone: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' },
  teacher: { icon: Users, tone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' },
  leave: { icon: ClipboardCheck, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300' },
  event: { icon: CalendarDays, tone: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300' },
};

export function relativeActivityTime(timestamp: string, now = Date.now()): string {
  const elapsed = Math.max(0, now - Date.parse(timestamp));
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  if (hours < 48) return 'Yesterday';
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString('en-GB', { timeZone: 'Asia/Kathmandu', day: 'numeric', month: 'short', year: 'numeric' });
}

export function ActivityRow({ item }: { item: SchoolActivity }) {
  const { icon: Icon, tone } = iconStyles[item.kind];
  return <Link href={item.href} aria-label={`${item.title}: ${item.detail}`} className="group flex min-h-[86px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600 dark:hover:bg-slate-800 sm:p-4">
    <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${tone}`}><Icon className="h-5 w-5 sm:h-6 sm:w-6" /></span>
    <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold text-slate-950 dark:text-white sm:text-sm">{item.title}</span><span className="mt-0.5 block truncate text-xs text-slate-700 dark:text-slate-300">{item.detail}</span><span className="mt-2 flex flex-wrap gap-1.5">{item.actor && <span className="max-w-full truncate rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.actor}</span>}<time dateTime={item.occurredAt} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{relativeActivityTime(item.occurredAt)}</time></span></span>
    <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-blue-600 dark:text-slate-400" />
  </Link>;
}

export default function RecentActivity({ items, loading = false }: { items: SchoolActivity[]; loading?: boolean }) {
  return <section aria-labelledby="recent-activity-title" className="mt-5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:mt-6 sm:p-5">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 id="recent-activity-title" className="text-base font-bold text-slate-950 dark:text-white sm:text-lg">Recent activity</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Latest important actions across your school</p></div><Link href="/principal/activity" className="inline-flex min-h-9 shrink-0 items-center rounded-xl bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900">View all</Link></div>
    {loading ? <p className="mt-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">Loading activity…</p>
      : items.length ? <div className="mt-3 grid gap-2.5">{items.slice(0, 4).map((item) => <ActivityRow key={item.id} item={item} />)}</div>
      : <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><Inbox className="h-5 w-5 text-blue-600 dark:text-blue-300" /><div><p className="text-sm font-bold text-slate-900 dark:text-white">No recent activity</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">New school actions will appear here as they happen.</p></div></div>}
  </section>;
}
