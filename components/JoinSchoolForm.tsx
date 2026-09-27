'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GraduationCap, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function JoinSchoolForm({ role }: { role: 'teacher' | 'student' }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState({ schoolCode: '', joinCode: '', fullName: '', email: '', password: '', phone: '', subject: '', qualification: '', studentClass: '', section: '', rollNo: '', parentName: '', parentPhone: '' });
  const set = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const fields: Array<[keyof typeof values, string, string, boolean]> = [
    ['schoolCode', 'School Code', 'text', true], ['joinCode', `${role === 'teacher' ? 'Teacher' : 'Student'} Join Code`, 'text', true],
    ['fullName', 'Full name', 'text', true], ['email', 'Email address', 'email', true], ['password', 'Password (at least 8 characters)', 'password', true],
    ['phone', 'Phone', 'tel', false],
    ...(role === 'teacher' ? [['subject', 'Main subject', 'text', false], ['qualification', 'Qualification', 'text', false]] : [['studentClass', 'Class / grade', 'text', true], ['section', 'Section', 'text', false], ['rollNo', 'Roll number', 'text', false], ['parentName', 'Guardian name', 'text', false], ['parentPhone', 'Guardian phone', 'tel', false]]) as Array<[keyof typeof values, string, string, boolean]>,
  ];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (!/^\d{6}$/.test(values.schoolCode) || !/^\d{6}$/.test(values.joinCode)) { setError('Enter both 6-digit codes.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/request-school-account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, role }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Your request could not be sent.');
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: values.email.trim(), password: values.password });
      if (loginError) { router.replace(`/auth/login?role=${role}`); return; }
      router.replace('/auth/pending');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <div className="mx-auto max-w-lg"><Link href={`/auth/login?role=${role}`} className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300"><ArrowLeft className="h-4 w-4" />Back to sign in</Link>
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">{role === 'teacher' ? <ShieldCheck /> : <GraduationCap />}<h1 className="text-2xl font-bold">Join as a {role}</h1></div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Enter the codes your school shared. You can sign in after the school approves your request.</p>
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">{fields.map(([key, label, type, required]) => <label key={key} className={key === 'email' || key === 'password' ? 'sm:col-span-2' : ''}><span className="mb-1.5 block text-sm font-semibold">{label}</span><input required={required} type={type} autoComplete={key === 'password' ? 'new-password' : key === 'email' ? 'email' : 'off'} minLength={key === 'password' ? 8 : undefined} inputMode={key === 'schoolCode' || key === 'joinCode' ? 'numeric' : undefined} maxLength={key === 'schoolCode' || key === 'joinCode' ? 6 : undefined} pattern={key === 'schoolCode' || key === 'joinCode' ? '[0-9]{6}' : undefined} value={values[key]} onChange={(event) => set(key, event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>)}
          {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400 sm:col-span-2">{error}</p>}
          <button disabled={busy} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:col-span-2">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Request to join</button>
        </form>
      </div>
    </div>
  </main>;
}
