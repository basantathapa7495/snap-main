'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PortalAccessGate({ role, children }: { role: 'teacher' | 'student'; children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [disabled, setDisabled] = useState(false);
  useEffect(() => {
    let active = true;
    async function verify() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(`/auth/login?role=${role}`); return; }
      if (['pending', 'rejected'].includes(user.app_metadata?.approval_status)) { router.replace('/auth/pending'); return; }
      const { data: profile } = await supabase.from('profiles').select('school_id,role').eq('user_id', user.id).maybeSingle();
      if (!profile?.school_id || profile.role !== role) { router.replace('/auth/login'); return; }
      const { data: person } = await supabase.from(role === 'teacher' ? 'teachers' : 'students').select('id').eq('school_id', profile.school_id).eq('user_id', user.id).maybeSingle();
      const { data: school } = await supabase.from('schools').select('teacher_portal_enabled,student_portal_enabled').eq('id', profile.school_id).maybeSingle();
      const portalEnabled = role === 'teacher' ? school?.teacher_portal_enabled : school?.student_portal_enabled;
      if (active && portalEnabled === false) setDisabled(true);
      else if (active && person) setAllowed(true);
      else if (active) router.replace('/auth/pending');
    }
    void verify();
    return () => { active = false; };
  }, [role, router]);
  if(disabled)return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300"><div><h1 className="text-lg font-bold text-slate-900 dark:text-white">Portal access is disabled</h1><p className="mt-2">Your school principal has temporarily disabled the {role} portal.</p></div></main>;
  return allowed ? children : <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300" role="status">Checking school access…</main>;
}
