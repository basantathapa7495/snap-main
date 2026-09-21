'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle2, GraduationCap, Loader2, School, ShieldCheck, UserRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type SchoolInfo = { name: string; logo_url: string | null };
type Role = 'teacher' | 'student';
const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

export default function SchoolAccountRequestPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></main>}><SchoolAccountRequestForm /></Suspense>;
}

function SchoolAccountRequestForm() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [role, setRole] = useState<Role>(() => searchParams.get('role') === 'student' ? 'student' : 'teacher');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', subject: '', qualification: '', studentClass: '', section: '', rollNo: '', parentName: '', parentPhone: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('schools').select('name,logo_url').eq('slug', slug).eq('is_approved', true).maybeSingle().then(({ data }) => { setSchool(data); setLoading(false); });
  }, [slug]);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSubmitting(true); setError('');
    const response = await fetch('/api/request-school-account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolSlug: slug, role, ...form }) });
    const result = await response.json();
    if (!response.ok) setError(result.error || 'Your request could not be submitted.'); else setSuccess(true);
    setSubmitting(false);
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></main>;
  if (!school) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5"><div className="text-center"><School className="mx-auto h-9 w-9 text-slate-400" /><h1 className="mt-3 text-xl font-bold">School unavailable</h1></div></main>;
  if (success) return <main className="school-pattern-grid relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-5"><div className="relative z-10 w-full max-w-lg rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" /><h1 className="mt-4 text-2xl font-bold text-slate-950">Request sent for approval</h1><p className="mt-2 text-sm leading-6 text-slate-600">{role === 'teacher' ? 'The principal' : 'A principal or verified teacher'} at {school.name} must verify your details before you can sign in.</p><Link href={`/s/${slug}/login`} className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Return to portal</Link></div></main>;

  return <main className="school-pattern-grid relative isolate min-h-screen overflow-hidden bg-slate-50 px-4 py-8"><div className="relative z-10 mx-auto max-w-3xl"><Link href={`/s/${slug}/login`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Back to school portal</Link><div className="mt-5 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-blue-900/10"><div className="bg-slate-950 px-5 py-7 text-white sm:px-8"><div className="flex items-center gap-4">{school.logo_url ? <Image src={school.logo_url} alt={`${school.name} logo`} width={56} height={56} unoptimized className="h-14 w-14 rounded-xl bg-white object-cover p-1" /> : <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600"><School className="h-6 w-6" /></span>}<div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-300">Account request</p><h1 className="mt-1 text-xl font-bold sm:text-2xl">Join {school.name}</h1></div></div></div><div className="p-5 sm:p-8"><div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5"><button type="button" onClick={() => setRole('teacher')} className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${role === 'teacher' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}><UserRound className="h-4 w-4" />Teacher</button><button type="button" onClick={() => setRole('student')} className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${role === 'student' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}><GraduationCap className="h-4 w-4" />Student</button></div><div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Your account remains locked until the school verifies your identity and details.</div>{error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Full name" value={form.fullName} onChange={(v) => update('fullName', v)} required /><Field label="Email" value={form.email} onChange={(v) => update('email', v)} type="email" required /><Field label="Create password" value={form.password} onChange={(v) => update('password', v)} type="password" required /><Field label="Phone number" value={form.phone} onChange={(v) => update('phone', v)} type="tel" />{role === 'teacher' ? <><Field label="Main subject" value={form.subject} onChange={(v) => update('subject', v)} /><Field label="Qualification" value={form.qualification} onChange={(v) => update('qualification', v)} /></> : <><Field label="Class" value={form.studentClass} onChange={(v) => update('studentClass', v)} required /><Field label="Section" value={form.section} onChange={(v) => update('section', v)} /><Field label="Roll number" value={form.rollNo} onChange={(v) => update('rollNo', v)} /><Field label="Parent/guardian name" value={form.parentName} onChange={(v) => update('parentName', v)} /><Field label="Parent phone" value={form.parentPhone} onChange={(v) => update('parentPhone', v)} type="tel" /></>}<button type="submit" disabled={submitting} className={`sm:col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition disabled:opacity-60 ${role === 'teacher' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Submit {role} request</button></form></div></div></div></main>;
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500"> *</span>}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} minLength={type === 'password' ? 8 : undefined} className={inputClass} /></label>; }
