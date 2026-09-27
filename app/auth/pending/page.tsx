'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock3, RefreshCw, ShieldX } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PendingPage() {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'pending' | 'rejected' | 'error'>('loading');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const check = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/auth/login'); return; }
    try {
      const response = await fetch('/api/join-status', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load request');
      const result = await response.json();
      if (result.status === 'approved') { await supabase.auth.refreshSession(); router.replace(`/${result.role}`); return; }
      if (result.status === 'none') { router.replace('/auth/login'); return; }
      setRole(result.role === 'student' ? 'student' : 'teacher'); setState(result.status === 'rejected' ? 'rejected' : 'pending');
    } catch { setState('error'); }
  }, [router]);
  useEffect(() => { const timer = window.setTimeout(() => { void check(); }, 0); return () => window.clearTimeout(timer); }, [check]);
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-white">
    {state === 'rejected' ? <ShieldX className="mx-auto h-10 w-10 text-rose-500" /> : <Clock3 className="mx-auto h-10 w-10 text-blue-600" />}
    <h1 className="mt-4 text-xl font-bold">{state === 'rejected' ? 'Request not approved' : state === 'pending' ? 'Waiting for school approval' : state === 'loading' ? 'Checking your request' : 'Request could not be loaded'}</h1>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{state === 'rejected' ? 'Your school declined this request. Contact the school for help.' : state === 'pending' ? `Your ${role} account will become available when your school approves it.` : 'Please try again.'}</p>
    <button onClick={() => void check()} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white focus-visible:ring-2"><RefreshCw className="h-4 w-4" />Check status</button>
    <div className="mt-5"><Link href={`/auth/login?role=${role}`} onClick={() => { void supabase.auth.signOut(); }} className="text-sm font-medium text-blue-700 dark:text-blue-300">Sign out and return to login</Link></div>
  </section></main>;
}
