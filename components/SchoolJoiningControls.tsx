'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Codes = { school_code: string; teacher_join_code?: string; student_join_code?: string; teacher_join_enabled?: boolean; student_join_enabled?: boolean };
export default function SchoolJoiningControls({ role }: { role: 'teacher' | 'student' }) {
  const [codes, setCodes] = useState<Codes | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
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
    if (action === 'regenerate' && !window.confirm(`Regenerate the ${role} Join Code? The old code will stop working immediately.`)) return;
    setBusy(true); setError(''); setMessage('');
    try { await call({ role, action, enabled }); setCodes((await call()).codes); setMessage(action === 'regenerate' ? 'New code is ready. The old code no longer works.' : `Student/teacher joining setting saved.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  const enabled = role === 'teacher' ? codes?.teacher_join_enabled : codes?.student_join_enabled;
  const joinCode = role === 'teacher' ? codes?.teacher_join_code : codes?.student_join_code;
  return <section className="mt-5 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-bold text-slate-950 dark:text-white"><ShieldCheck className="h-5 w-5 text-blue-600" />{role === 'teacher' ? 'Teacher' : 'Student'} joining</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">New accounts require approval. Turning joining off does not affect approved members.</p></div>
      <button type="button" disabled={busy || !codes} onClick={() => void update('set-enabled', !enabled)} aria-pressed={Boolean(enabled)} className={`min-h-11 rounded-xl px-5 text-sm font-bold text-white focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 ${enabled ? 'bg-emerald-600' : 'bg-slate-600'}`}>{enabled ? 'Joining ON' : 'Joining OFF'}</button></div>
    {codes && <div className="mt-4 grid gap-3 sm:grid-cols-2">{([['School Code', codes.school_code], [`${role === 'teacher' ? 'Teacher' : 'Student'} Join Code`, joinCode]] as const).map(([label, code]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"><p className="text-xs font-medium text-slate-500 dark:text-slate-300">{label}</p><div className="mt-1 flex items-center justify-between gap-2"><code className="text-lg font-bold tracking-[0.15em] text-slate-950 dark:text-white">{code}</code><button type="button" onClick={() => { void navigator.clipboard.writeText(code || '').then(() => setMessage(`${label} copied.`)).catch(() => setError('Copy failed. Select the code to copy it.')); }} aria-label={`Copy ${label}`} className="rounded-lg p-2 text-blue-700 hover:bg-blue-100 focus-visible:ring-2 dark:text-blue-300 dark:hover:bg-slate-700"><Copy className="h-4 w-4" /></button></div></div>)}</div>}
    <button type="button" disabled={busy || !codes} onClick={() => void update('regenerate')} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-300 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:ring-2 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-slate-800"><RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />Regenerate {role} code</button>
    {error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}{message && <p role="status" className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">{message}</p>}
  </section>;
}
