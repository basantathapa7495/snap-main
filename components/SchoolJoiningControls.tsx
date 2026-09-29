'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, EllipsisVertical, Info, RefreshCw, School, ShieldCheck, UsersRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Codes = { school_code: string; teacher_join_code?: string; student_join_code?: string; teacher_join_enabled?: boolean; student_join_enabled?: boolean };
export default function SchoolJoiningControls({ role }: { role: 'teacher' | 'student' }) {
  const [codes, setCodes] = useState<Codes | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCodeInfo, setShowCodeInfo] = useState(false);
  const call = useCallback(async (body?: object) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Please sign in again.');
    const response = await fetch('/api/school-join-codes', { method: body ? 'PATCH' : 'GET', headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Joining settings could not be updated.');
    return result;
  }, []);
  useEffect(() => { void call().then((result) => setCodes(result.codes)).catch((cause) => setError(cause.message)); }, [call]);
  async function update(action: 'regenerate' | 'set-enabled', enabled?: boolean) {
    if (busy || !codes) return;
    if (action === 'regenerate' && !window.confirm(`Regenerate the ${role} Join Code? The old code will stop working immediately.`)) return;
    const previousCodes = codes;
    const enabledKey = role === 'teacher' ? 'teacher_join_enabled' : 'student_join_enabled';
    const codeKey = role === 'teacher' ? 'teacher_join_code' : 'student_join_code';
    setBusy(true); setError(''); setMessage('');
    if (action === 'set-enabled') setCodes({ ...previousCodes, [enabledKey]: enabled });
    try {
      const result = await call({ role, action, enabled });
      if (action === 'regenerate') setCodes((current) => current ? { ...current, [codeKey]: result.joinCode } : current);
      setMessage(action === 'regenerate' ? 'New code is ready. The old code no longer works.' : `${role === 'teacher' ? 'Teacher' : 'Student'} joining setting saved.`);
    }
    catch (cause) {
      if (action === 'set-enabled') setCodes(previousCodes);
      setError(cause instanceof Error ? cause.message : 'Please try again.');
    }
    finally { setBusy(false); }
  }
  const enabled = role === 'teacher' ? codes?.teacher_join_enabled : codes?.student_join_enabled;
  const joinCode = role === 'teacher' ? codes?.teacher_join_code : codes?.student_join_code;
  const person = role === 'teacher' ? 'teachers' : 'students';
  const roleLabel = role === 'teacher' ? 'Teacher' : 'Student';
  const copy = (label: string, code: string) => {
    void navigator.clipboard.writeText(code).then(() => setMessage(`${label} copied.`)).catch(() => setError('Copy failed. Select the code to copy it.'));
  };

  return <div className="mt-3 space-y-2.5 text-slate-950 dark:text-white">
    <section className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50/30 px-3 py-2 shadow-sm dark:border-blue-900 dark:bg-blue-950/20 sm:px-4 sm:py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1"><h2 className="text-sm font-bold sm:text-base">{roleLabel} joining</h2><p className="mt-0.5 text-[11px] leading-4 text-slate-600 dark:text-slate-300 sm:text-xs">Allow {person} to request access to this school.</p></div>
      <div className="flex shrink-0 flex-col items-center gap-1">
        <button type="button" role="switch" aria-label={`Allow ${person} to request access`} aria-checked={Boolean(enabled)} disabled={busy || !codes} onClick={() => void update('set-enabled', !enabled)} className={`relative h-8 w-[58px] rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-50 sm:h-9 sm:w-[66px] ${enabled ? 'bg-blue-600' : 'bg-slate-400 dark:bg-slate-600'}`}><span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all sm:h-7 sm:w-7 ${enabled ? 'left-[30px] sm:left-[35px]' : 'left-1'}`} /></button>
        <span className={`whitespace-nowrap text-[10px] font-bold sm:text-xs ${enabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{enabled ? '● Joining ON' : 'Joining OFF'}</span>
      </div>
    </section>
    {codes && enabled && <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <section className="flex min-w-0 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/30 px-2 py-2 dark:border-blue-900 dark:bg-blue-950/20 sm:gap-3 sm:p-3">
        <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 sm:flex"><School className="h-4 w-4" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1"><h3 className="whitespace-nowrap text-[10px] leading-tight text-slate-500 dark:text-slate-300 sm:text-xs">School Code</h3><code className="block whitespace-nowrap text-[clamp(13px,4vw,18px)] font-extrabold leading-tight tracking-[0.04em] sm:text-xl">{codes.school_code}</code></div>
        <button type="button" onClick={() => copy('School Code', codes.school_code)} aria-label="Copy School Code" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-700 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300 sm:h-9 sm:w-9"><Copy className="h-4 w-4" /></button>
      </section>
      <section className="flex min-w-0 items-center gap-1 rounded-xl border border-violet-200 bg-violet-50/30 px-2 py-2 dark:border-violet-900 dark:bg-violet-950/20 sm:gap-3 sm:p-3">
        <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 sm:flex"><UsersRound className="h-4 w-4" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1"><h3 className="whitespace-nowrap text-[10px] leading-tight text-slate-500 dark:text-slate-300 sm:text-xs">{roleLabel} Join Code</h3><code className="block whitespace-nowrap text-[clamp(13px,4vw,18px)] font-extrabold leading-tight tracking-[0.04em] sm:text-xl">{joinCode}</code></div>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button type="button" onClick={() => copy(`${roleLabel} Join Code`, joinCode || '')} aria-label={`Copy ${roleLabel} Join Code`} className="flex h-8 w-7 items-center justify-center rounded-lg border border-violet-200 bg-white text-blue-700 dark:border-violet-800 dark:bg-slate-900 dark:text-blue-300 sm:h-9 sm:w-9"><Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
          <div className="relative"><button type="button" aria-label="Join code options" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="flex h-8 w-5 items-center justify-center rounded-lg border border-violet-200 bg-white dark:border-violet-800 dark:bg-slate-900 sm:h-9 sm:w-8"><EllipsisVertical className="h-4 w-4" /></button>
            {menuOpen && <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <button type="button" disabled={busy} onClick={() => { setMenuOpen(false); void update('regenerate'); }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"><RefreshCw className="h-4 w-4 text-blue-600" />Regenerate</button>
              <button type="button" onClick={() => { setMenuOpen(false); setShowCodeInfo((show) => !show); }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"><Info className="h-4 w-4 text-slate-500" />About this code</button>
            </div>}
          </div>
        </div>
      </section>
    </div>}
    {enabled && showCodeInfo && <p className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-slate-700 dark:border-violet-900 dark:bg-violet-950/20 dark:text-slate-200">Share the School Code and {roleLabel} Join Code with {person} you invite. Regenerating the join code makes the previous code stop working. Existing approved accounts remain active.</p>}
    {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}{message && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>}
  </div>;
}
