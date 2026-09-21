'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, Clock3, Loader2, Mail, Phone, ShieldCheck, UserCheck, UserRound, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type AccountRequest = {
  id: string;
  requested_role: 'teacher' | 'student';
  full_name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  qualification: string | null;
  class: string | null;
  section: string | null;
  roll_no: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  created_at: string;
};

export default function AccountRequestsPanel({ role, onApproved }: { role: 'teacher' | 'student'; onApproved?: () => void }) {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { setError('Sign in again to review requests.'); setLoading(false); return; }
    const response = await fetch(`/api/account-requests?role=${role}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
    const result = await response.json();
    if (!response.ok) setError(result.error || 'Requests could not be loaded.'); else setRequests(result.requests || []);
    setLoading(false);
  }, [role]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function review(requestId: string, action: 'approve' | 'reject') {
    setWorkingId(requestId); setError(''); setMessage('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { setError('Your session expired. Please sign in again.'); setWorkingId(''); return; }
    const response = await fetch('/api/account-requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ requestId, action }) });
    const result = await response.json();
    if (!response.ok) setError(result.error || 'The request could not be reviewed.');
    else { setRequests((current) => current.filter((item) => item.id !== requestId)); setMessage(action === 'approve' ? `${role === 'teacher' ? 'Teacher' : 'Student'} account approved.` : 'Account request rejected.'); if (action === 'approve') onApproved?.(); }
    setWorkingId('');
  }

  return <section className="mt-5 overflow-hidden rounded-3xl border border-violet-200 bg-white/90 shadow-lg shadow-violet-900/5 backdrop-blur-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-blue-50 px-4 py-4 sm:px-5">
      <div><h2 className="flex items-center gap-2 font-bold text-slate-950"><ShieldCheck className="h-5 w-5 text-violet-600" />Pending {role} requests</h2><p className="mt-1 text-xs leading-5 text-slate-600">Verify the person and school details before granting portal access.</p></div>
      <span className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-bold text-white">{requests.length} waiting</span>
    </div>
    {(error || message) && <div className={`m-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}<span>{error || message}</span></div>}
    {loading ? <div className="flex min-h-28 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-violet-600" /></div> : requests.length === 0 ? <div className="flex min-h-28 flex-col items-center justify-center px-5 py-7 text-center"><UserCheck className="h-7 w-7 text-emerald-500" /><p className="mt-2 text-sm font-bold text-slate-800">No pending requests</p><p className="mt-1 text-xs text-slate-500">New self-registration requests will appear here.</p></div> : <div className="grid gap-3 p-4 lg:grid-cols-2">{requests.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><UserRound className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="truncate font-bold text-slate-950">{item.full_name}</h3><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500"><Mail className="h-3.5 w-3.5" />{item.email}</p>{(item.phone || item.parent_phone) && <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Phone className="h-3.5 w-3.5" />{item.phone || item.parent_phone}</p>}</div></div><div className="mt-3 flex flex-wrap gap-2 text-xs">{role === 'teacher' ? <><span className="rounded-lg bg-blue-50 px-2.5 py-1.5 font-semibold text-blue-700">{item.subject || 'Subject not provided'}</span><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-600">{item.qualification || 'Qualification not provided'}</span></> : <><span className="rounded-lg bg-blue-50 px-2.5 py-1.5 font-semibold text-blue-700">Class {item.class || '—'}{item.section ? ` · ${item.section}` : ''}</span>{item.roll_no && <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-600">Roll {item.roll_no}</span>}</>}<span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 font-semibold text-amber-700"><Clock3 className="h-3 w-3" />{new Date(item.created_at).toLocaleDateString()}</span></div><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={Boolean(workingId)} onClick={() => review(item.id, 'reject')} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"><X className="h-3.5 w-3.5" />Reject</button><button type="button" disabled={Boolean(workingId)} onClick={() => review(item.id, 'approve')} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">{workingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Approve</button></div></article>)}</div>}
  </section>;
}
