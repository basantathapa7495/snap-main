'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { ActivityRow } from '@/components/RecentActivity';
import { fetchSchoolActivity, type SchoolActivity } from '@/lib/recent-activity';
import { supabase } from '@/lib/supabase';

function nepalDay(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export default function ActivityCenterPage() {
  const [items, setItems] = useState<SchoolActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clock] = useState(() => new Date());
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError('');
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Sign in to view school activity.');
        const { data: profile, error: profileError } = await supabase.from('profiles').select('school_id,role').eq('user_id', user.id).single();
        if (profileError || !profile?.school_id || !['principal','admin','school_admin'].includes(profile.role || '')) throw new Error('Your principal school profile could not be loaded.');
        const result = await fetchSchoolActivity(profile.school_id, 40);
        if (!cancelled) setItems(result);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Activity could not be loaded.');
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [revision]);
  const today = nepalDay(clock);
  const yesterday = nepalDay(new Date(clock.getTime() - 86400000));
  const groups = [
    { label: 'Today', items: items.filter((item) => nepalDay(new Date(item.occurredAt)) === today) },
    { label: 'Yesterday', items: items.filter((item) => nepalDay(new Date(item.occurredAt)) === yesterday) },
    { label: 'Earlier', items: items.filter((item) => ![today, yesterday].includes(nepalDay(new Date(item.occurredAt)))) },
  ];
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Sidebar /><div className="flex min-h-screen flex-col pt-14 lg:ml-64 lg:pt-0"><div className="hidden lg:block"><TopBar /></div><main className="flex-1 px-3.5 pb-24 pt-5 sm:px-6 lg:px-8 lg:pt-24"><div className="mx-auto max-w-3xl">
    <Link href="/principal" className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
    <header className="mt-2 flex items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">Activity Center</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest important actions across your school</p></div><button type="button" onClick={() => setRevision((current) => current + 1)} disabled={loading} aria-label="Refresh activity" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-60 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></header>
    {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
    {loading ? <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">Loading activity…</p> : items.length ? groups.filter((group) => group.items.length).map((group) => <section key={group.label} aria-label={group.label} className="mt-6"><h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{group.label}</h2><div className="grid gap-2.5">{group.items.map((item) => <ActivityRow key={item.id} item={item} />)}</div></section>) : !error && <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900"><h2 className="font-bold text-slate-950 dark:text-white">No recent activity</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">New school actions will appear here as they happen.</p></div>}
  </div></main></div></div>;
}
