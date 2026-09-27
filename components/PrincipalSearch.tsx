'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { BookOpen, CalendarDays, ChevronRight, Clock3, FileText, FolderOpen, GraduationCap, Receipt, Search, School, UserPlus, Users, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cleanSearchQuery, searchGroups, searchPrincipalSchool, type SearchGroup, type SearchResult } from '@/lib/principal-search';

const icons = { Students: Users, Teachers: GraduationCap, Classes: School, Admissions: UserPlus, 'Fees & Receipts': Receipt, Documents: FolderOpen, Notices: FileText, Exams: BookOpen, Calendar: CalendarDays };
const tones: Record<SearchGroup, string> = {
  Students: 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300', Teachers: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  Classes: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300', Admissions: 'bg-teal-100 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300',
  'Fees & Receipts': 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300', Documents: 'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
  Notices: 'bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300', Exams: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300',
  Calendar: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300',
};
const storageKey = 'nepsom:principal:recent-searches';

export default function PrincipalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]').filter((value: unknown) => typeof value === 'string').slice(0, 5); }
    catch { return []; }
  });
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'searching' | 'results' | 'error'>('idle');
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    const requests = requestRef;
    void (async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { if (!cancelled) setState('error'); return; }
      const { data: profile, error } = await supabase.from('profiles').select('school_id,role').eq('user_id', user.id).single();
      if (cancelled) return;
      if (error || !profile?.school_id || !['principal', 'admin', 'school_admin'].includes(profile.role || '')) { setState('error'); return; }
      setSchoolId(profile.school_id);
    })();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => { cancelled = true; requests.current++; cancelAnimationFrame(frame); document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !schoolId) return;
    const trimmed = cleanSearchQuery(query);
    if (trimmed.length < 2) return;
    const request = ++requestRef.current;
    const timeout = window.setTimeout(() => {
      void searchPrincipalSchool(schoolId, trimmed).then((items) => {
        if (request !== requestRef.current) return;
        setResults(items); setActive(0); setState('results');
      }).catch((error) => {
        if (request !== requestRef.current) return;
        console.error('Principal search failed', error); setState('error');
      });
    }, 300);
    const requests = requestRef;
    return () => { window.clearTimeout(timeout); requests.current++; };
  }, [open, schoolId, query]);

  function changeQuery(value: string) {
    setQuery(value);
    if (cleanSearchQuery(value).length < 2) { requestRef.current++; setResults([]); setState('idle'); }
    else setState('searching');
  }
  function openResult(result: SearchResult) {
    const text = query.trim();
    if (text.length >= 2) {
      const next = [text, ...recent.filter((value) => value.toLowerCase() !== text.toLowerCase())].slice(0, 5);
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Search still works without storage. */ }
      setRecent(next);
    }
    onClose(); router.push(result.href);
  }
  if (!open || typeof document === 'undefined') return null;
  return createPortal(<div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/55 sm:px-4 sm:pt-[min(10vh,90px)]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label="Search school records" className="flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[min(80dvh,720px)] sm:max-w-xl sm:rounded-2xl sm:border sm:border-slate-700/30">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-700 sm:p-4">
        <button type="button" onClick={onClose} aria-label="Close search" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-slate-300 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:ring-2 focus-within:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"><Search className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" /><span className="sr-only">Search school records</span><input ref={inputRef} type="search" enterKeyHint="search" value={query} onChange={(event) => changeQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); setActive((index) => (index + 1) % results.length); }
          if (event.key === 'ArrowUp' && results.length) { event.preventDefault(); setActive((index) => (index - 1 + results.length) % results.length); }
          if (event.key === 'Enter' && state === 'results' && results[active]) openResult(results[active]);
        }} placeholder="Search students, teachers, fees..." className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-400" /></label>
      </div>
      <div aria-live="polite" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pb-4">
        {state === 'idle' && <><div className="text-xs font-medium text-slate-500 dark:text-slate-400">Search starts after 2 characters</div>{recent.length > 0 && <div className="mt-5"><h2 className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-200">Recent searches</h2><div className="flex flex-wrap gap-2">{recent.map((item) => <button key={item} type="button" onClick={() => changeQuery(item)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><Clock3 className="h-3.5 w-3.5" />{item}</button>)}</div></div>}<div className="py-12 text-center"><Search className="mx-auto h-8 w-8 text-blue-600 dark:text-blue-400" /><h2 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Search across your school</h2><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">Try a student, teacher, class, receipt, document, notice, exam, or admission.</p></div></>}
        {state === 'searching' && <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">Searching...</p>}
        {state === 'error' && <div role="alert" className="py-12 text-center text-sm text-rose-700 dark:text-rose-300">Search couldn’t be completed. Try again.</div>}
        {state === 'results' && !results.length && <div className="py-12 text-center"><h2 className="text-sm font-bold text-slate-900 dark:text-white">No results for “{query.trim()}”</h2><p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Try a student name, teacher, receipt number, document, class, notice, exam, or admission.</p></div>}
        {state === 'results' && searchGroups.map((group) => { const rows = results.filter((item) => item.group === group); if (!rows.length) return null; return <section key={group} className="mb-5"><h2 className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-200">{group} ({rows.length})</h2><div className="grid gap-2">{rows.map((item) => { const Icon = icons[item.group]; const index = results.indexOf(item); return <button key={`${group}-${item.id}`} type="button" onClick={() => openResult(item)} className={`flex min-h-16 w-full min-w-0 items-center gap-3 rounded-xl border p-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 ${active === index ? 'border-blue-300 bg-blue-50 dark:bg-blue-400/10' : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/60'}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[item.group]}`}><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-950 dark:text-white">{item.title}</span><span className="mt-0.5 block truncate text-xs text-slate-600 dark:text-slate-300">{item.detail}</span>{item.meta && <span className="mt-1 inline-block max-w-full truncate rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] text-slate-700 dark:bg-slate-700 dark:text-slate-200">{item.meta}</span>}</span><ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /></button>; })}</div></section>; })}
      </div>
    </section>
  </div>, document.body);
}
