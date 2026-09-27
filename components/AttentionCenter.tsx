"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, FileText, UserPlus, Users, Wallet, X } from "lucide-react";

export type AttentionItemData = {
  id: string;
  priority: "urgent" | "action" | "watch";
  icon: "attendance" | "leave" | "admission" | "teacher" | "student" | "document" | "fees";
  title: string;
  description: string;
  action: string;
  href: string;
};

const icons = {
  attendance: ClipboardCheck,
  leave: CalendarDays,
  admission: UserPlus,
  teacher: BookOpen,
  student: Users,
  document: FileText,
  fees: Wallet,
};
const tone = {
  urgent: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  action: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  watch: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
};
const rank = { urgent: 0, action: 1, watch: 2 };

function AttentionRow({ item, onNavigate }: { item: AttentionItemData; onNavigate?: () => void }) {
  const Icon = icons[item.icon];
  return (
    <Link href={item.href} onClick={onNavigate} className="group flex min-h-16 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 transition hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone[item.priority]}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-slate-950 dark:text-white">{item.title}</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-600 dark:text-slate-300">{item.description}</span></span>
      <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">{item.action}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
    </Link>
  );
}

export default function AttentionCenter({ items, compact = false }: { items: AttentionItemData[]; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const ordered = [...items].sort((a, b) => rank[a.priority] - rank[b.priority]);
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const returnFocus = trigger.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const focusables = document.querySelectorAll<HTMLElement>("#attention-dialog a, #attention-dialog button");
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); returnFocus?.focus(); };
  }, [open]);

  return (
    <section className={`${compact ? "mt-5 p-3.5" : "mt-5 p-4 sm:mt-6 sm:p-5"} rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900`} aria-label="Needs your attention">
      <div className="flex items-start justify-between gap-2">
        <div><h2 className={`${compact ? "text-base" : "text-lg"} font-bold text-slate-950 dark:text-white`}>Needs your attention</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{items.length} {items.length === 1 ? "item needs" : "items need"} action</p></div>
        {items.length > 0 && <button ref={trigger} type="button" onClick={() => setOpen(true)} className="min-h-9 shrink-0 rounded-lg bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300">View all</button>}
      </div>
      {ordered.length ? <div className={`mt-3 grid gap-2 ${compact ? "" : "lg:grid-cols-3"}`}>
        {ordered.slice(0, 3).map((item) => <AttentionRow key={item.id} item={item} />)}
      </div> : <div className="mt-3 flex items-start gap-3 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /><div><p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">You’re all caught up</p><p className="text-xs text-emerald-800 dark:text-emerald-300">There are no school tasks requiring your attention right now.</p></div></div>}
      {items.length > 3 && <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">Showing the 3 highest priority items</p>}
      {open && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <div id="attention-dialog" role="dialog" aria-modal="true" aria-labelledby="attention-title" className="flex max-h-[88dvh] w-full max-w-xl flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-700"><div><h3 id="attention-title" className="text-lg font-bold text-slate-950 dark:text-white">Attention Center</h3><p className="text-xs text-slate-500 dark:text-slate-400">{items.length} school {items.length === 1 ? "item needs" : "items need"} action</p></div><button ref={closeButton} type="button" onClick={() => setOpen(false)} aria-label="Close attention center" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700"><X className="h-5 w-5" /></button></div>
          <div className="overflow-y-auto p-4">{(["urgent", "action", "watch"] as const).map((priority) => {
            const group = ordered.filter((item) => item.priority === priority);
            return group.length ? <div key={priority} className="mb-5"><h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-300"><AlertCircle className={`h-3.5 w-3.5 ${priority === "urgent" ? "text-rose-600" : priority === "action" ? "text-amber-600" : "text-blue-600"}`} />{priority === "action" ? "Action needed" : priority}</h4><div className="grid gap-2">{group.map((item) => <AttentionRow key={item.id} item={item} onNavigate={() => setOpen(false)} />)}</div></div> : null;
          })}</div>
        </div>
      </div>}
    </section>
  );
}
