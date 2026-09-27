import Link from "next/link";
import { ArrowRight, CalendarPlus2, CreditCard, Megaphone, UploadCloud, type LucideIcon } from "lucide-react";

type Action = {
  title: string;
  description: string;
  destination: string;
  href: string;
  icon: LucideIcon;
  card: string;
  iconBox: string;
  button: string;
};

const actions: Action[] = [
  {
    title: "Add Event", description: "Create a school calendar event", destination: "Calendar", href: "/principal/calendar?action=create", icon: CalendarPlus2,
    card: "border-blue-200 bg-blue-50/90 hover:border-blue-400 dark:border-blue-800 dark:bg-blue-950/40 dark:hover:border-blue-500",
    iconBox: "bg-blue-100 text-blue-700 dark:bg-blue-900/80 dark:text-blue-200",
    button: "bg-blue-600 group-hover:bg-blue-700 dark:bg-blue-600 dark:group-hover:bg-blue-500",
  },
  {
    title: "Send Notice", description: "Create a school announcement", destination: "Communication", href: "/principal/communication?action=create", icon: Megaphone,
    card: "border-orange-200 bg-orange-50/90 hover:border-orange-400 dark:border-orange-800 dark:bg-orange-950/40 dark:hover:border-orange-500",
    iconBox: "bg-orange-100 text-orange-700 dark:bg-orange-900/80 dark:text-orange-200",
    button: "bg-orange-600 group-hover:bg-orange-700 dark:bg-orange-600 dark:group-hover:bg-orange-500",
  },
  {
    title: "Record Fee", description: "Record a student payment", destination: "Fees", href: "/principal/fees?action=record", icon: CreditCard,
    card: "border-emerald-200 bg-emerald-50/90 hover:border-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/40 dark:hover:border-emerald-500",
    iconBox: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-200",
    button: "bg-emerald-600 group-hover:bg-emerald-700 dark:bg-emerald-600 dark:group-hover:bg-emerald-500",
  },
  {
    title: "Upload Document", description: "Add a school file or document", destination: "Documents", href: "/principal/documents?action=upload", icon: UploadCloud,
    card: "border-violet-200 bg-violet-50/90 hover:border-violet-400 dark:border-violet-800 dark:bg-violet-950/40 dark:hover:border-violet-500",
    iconBox: "bg-violet-100 text-violet-700 dark:bg-violet-900/80 dark:text-violet-200",
    button: "bg-violet-700 group-hover:bg-violet-800 dark:bg-violet-600 dark:group-hover:bg-violet-500",
  },
];

export default function PrincipalQuickActions() {
  return <section aria-labelledby="principal-quick-actions" className="mt-5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:mt-6 sm:p-5">
    <h2 id="principal-quick-actions" className="text-base font-bold text-slate-950 dark:text-white sm:text-lg">Quick actions</h2>
    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Start common principal tasks instantly</p>
    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {actions.map(({ title, description, destination, href, icon: Icon, card, iconBox, button }) => <Link key={title} href={href} aria-label={`${title}: ${description}`} className={`group flex min-h-[190px] min-w-0 flex-col rounded-2xl border p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:p-4 ${card}`}>
        <span aria-hidden="true" className={`flex h-11 w-11 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconBox}`}><Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} /></span>
        <span className="mt-4 block min-w-0 text-[13px] font-bold leading-[1.2] text-slate-950 dark:text-white sm:text-base">{title}</span>
        <span className="mt-1 block min-h-9 text-[11px] leading-[18px] text-slate-600 dark:text-slate-300 sm:text-xs">{description}</span>
        <span aria-hidden="true" className={`mt-auto inline-flex min-h-10 w-fit max-w-full items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-bold text-white transition sm:px-4 sm:text-xs ${button}`}><span className="truncate">{destination}</span><ArrowRight className="h-3.5 w-3.5 shrink-0" /></span>
      </Link>)}
    </div>
  </section>;
}
