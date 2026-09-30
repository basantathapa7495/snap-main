'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronRight, Clock3, Search, Users, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type TeacherSearchResult = {
  id: string;
  group: 'Students' | 'Classes';
  title: string;
  detail: string;
  href: string;
};

const storageKey = 'nepsom:teacher:recent-searches';

function cleanQuery(value: string) {
  return value.trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, ' ').slice(0, 80);
}

export default function TeacherSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);
  const [query, setQuery] = useState('');
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [results, setResults] = useState<TeacherSearchResult[]>([]);
  const [state, setState] = useState<'idle' | 'searching' | 'results' | 'error'>('idle');
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]')
        .filter((value: unknown) => typeof value === 'string')
        .slice(0, 5);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => inputRef.current?.focus());

    void (async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        if (!cancelled) setState('error');
        return;
      }
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('school_id,role')
        .eq('user_id', user.id)
        .single();
      if (cancelled) return;
      if (error || !profile?.school_id || profile.role !== 'teacher') {
        setState('error');
        return;
      }
      setSchoolId(profile.school_id);
    })();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      cancelled = true;
      requestRef.current++;
      cancelAnimationFrame(frame);
      document.body.style.overflow = oldOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !schoolId) return;
    const cleaned = cleanQuery(query);
    if (cleaned.length < 2) return;

    const request = ++requestRef.current;
    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const pattern = `%${cleaned}%`;
          const classTerm = cleaned.replace(/^(grade|class)\s+/i, '');
          const [students, classes] = await Promise.all([
            supabase
              .from('students')
              .select('id,name,class,section,roll_no')
              .eq('school_id', schoolId)
              .or(`name.ilike.${pattern},roll_no.ilike.${pattern}`)
              .order('name')
              .limit(8),
            supabase
              .from('classes')
              .select('id,class_name,class,name,class_number,section,section_name')
              .eq('school_id', schoolId)
              .or(['class_name', 'class', 'name', 'class_number', 'section', 'section_name']
                .map((column) => `${column}.ilike.%${classTerm}%`)
                .join(','))
              .order('class_name')
              .limit(8),
          ]);

          if (students.error || classes.error) throw students.error || classes.error;

          const items: TeacherSearchResult[] = [
            ...(students.data || []).map((row) => ({
              id: row.id,
              group: 'Students' as const,
              title: row.name,
              detail: [row.class && `Grade ${row.class}${row.section || ''}`, row.roll_no && `Roll ${row.roll_no}`]
                .filter(Boolean)
                .join(' · ') || 'Student',
              href: `/teacher/students?student=${encodeURIComponent(row.id)}`,
            })),
            ...(classes.data || []).map((row) => ({
              id: row.id,
              group: 'Classes' as const,
              title: [row.class_name || row.class || row.name || row.class_number || 'Class', row.section_name || row.section]
                .filter(Boolean)
                .join(' · '),
              detail: 'My class',
              href: `/teacher/classes?class=${encodeURIComponent(row.id)}`,
            })),
          ];

          if (request !== requestRef.current) return;
          setResults(items);
          setActive(0);
          setState('results');
        } catch (error) {
          if (request !== requestRef.current) return;
          console.error('Teacher search failed', error);
          setState('error');
        }
      })();
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      requestRef.current++;
    };
  }, [open, query, schoolId]);

  function changeQuery(value: string) {
    setQuery(value);
    if (cleanQuery(value).length < 2) {
      requestRef.current++;
      setResults([]);
      setState('idle');
    } else {
      setState('searching');
    }
  }

  function openResult(result: TeacherSearchResult) {
    const text = query.trim();
    if (text.length >= 2) {
      const next = [text, ...recent.filter((value) => value.toLowerCase() !== text.toLowerCase())].slice(0, 5);
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Search works without storage. */ }
      setRecent(next);
    }
    onClose();
    router.push(result.href);
  }

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/55 sm:px-4 sm:pt-[min(10vh,90px)]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label="Search teacher records" className="flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[min(80dvh,720px)] sm:max-w-xl sm:rounded-2xl sm:border sm:border-slate-700/30">
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-700 sm:p-4">
          <button type="button" onClick={onClose} aria-label="Close search" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-slate-300 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:ring-2 focus-within:ring-blue-500 dark:border-slate-700 dark:bg-slate-800">
            <Search className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <span className="sr-only">Search students and classes</span>
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); setActive((index) => (index + 1) % results.length); }
                if (event.key === 'ArrowUp' && results.length) { event.preventDefault(); setActive((index) => (index - 1 + results.length) % results.length); }
                if (event.key === 'Enter' && state === 'results' && results[active]) openResult(results[active]);
              }}
              placeholder="Search students and classes..."
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-400"
            />
          </label>
        </div>

        <div aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pb-4">
          {state === 'idle' && (
            <>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Search starts after 2 characters</p>
              {recent.length > 0 && (
                <div className="mt-5">
                  <h2 className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-200">Recent searches</h2>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((item) => (
                      <button key={item} type="button" onClick={() => changeQuery(item)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Clock3 className="h-3.5 w-3.5" />{item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="py-12 text-center">
                <Search className="mx-auto h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h2 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Search your teaching records</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Find students and classes in your school.</p>
              </div>
            </>
          )}
          {state === 'searching' && <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">Searching...</p>}
          {state === 'error' && <p role="alert" className="py-12 text-center text-sm text-rose-700 dark:text-rose-300">Search couldn’t be completed. Try again.</p>}
          {state === 'results' && results.length === 0 && <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">No results for “{query.trim()}”</p>}
          {state === 'results' && (['Students', 'Classes'] as const).map((group) => {
            const rows = results.filter((item) => item.group === group);
            if (!rows.length) return null;
            const Icon = group === 'Students' ? Users : BookOpen;
            return (
              <section key={group} className="mb-5">
                <h2 className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-200">{group} ({rows.length})</h2>
                <div className="grid gap-2">
                  {rows.map((item) => {
                    const index = results.indexOf(item);
                    return (
                      <button key={`${group}-${item.id}`} type="button" onClick={() => openResult(item)} className={`flex min-h-16 w-full items-center gap-3 rounded-xl border p-2.5 text-left transition dark:border-slate-700 dark:bg-slate-800 ${active === index ? 'border-blue-300 bg-blue-50 dark:bg-blue-400/10' : 'border-slate-200 bg-slate-50 hover:border-blue-200'}`}>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300"><Icon className="h-5 w-5" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-slate-950 dark:text-white">{item.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-600 dark:text-slate-300">{item.detail}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>,
    document.body,
  );
}
