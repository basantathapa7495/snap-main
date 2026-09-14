'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, Check, Download, FileText, Loader2, Plus, RefreshCw,
  Search, TrendingUp, Users, Wallet, X,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

type Student = {
  id: string;
  name: string;
  class: string | null;
  section: string | null;
  roll_no: string | null;
  parent_phone: string | null;
};
type FeeType = { id: string; name: string; amount: number | string | null };
type Payment = {
  id: string;
  student_id: string;
  amount: number | string | null;
  payment_date: string;
  created_at: string | null;
};
type StudentBalance = Student & { paid: number; due: number; status: 'Paid' | 'Partial' | 'Unpaid' };

function todayNepal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
function currentMonth() { return todayNepal().slice(0, 7); }
function money(value: number) { return `NPR ${Math.round(value).toLocaleString()}`; }
function initials(name: string) {
  return name.split(' ').filter(Boolean).map((word) => word[0]).join('').slice(0, 2).toUpperCase();
}
function className(student: Student) {
  return [student.class ? `Class ${student.class}` : 'No class', student.section ? `Section ${student.section}` : ''].filter(Boolean).join(' · ');
}
function monthLabel(key: string) {
  return new Date(`${key}-01T12:00:00Z`).toLocaleDateString('en-US', { month: 'short' });
}
function recentMonths(count: number) {
  const result: string[] = [];
  const date = new Date();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    result.push(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - offset, 1)).toISOString().slice(0, 7));
  }
  return result;
}

export default function FeesPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [feeModal, setFeeModal] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<StudentBalance | null>(null);
  const [saving, setSaving] = useState(false);
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayNepal());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setRefreshing(true);
      setError('');
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          if (!cancelled) setAuthenticated(false);
          return;
        }
        const { data: profile, error: profileError } = await supabase
          .from('profiles').select('school_id').eq('user_id', user.id).single();
        if (profileError || !profile?.school_id) throw new Error('Your school profile could not be loaded.');

        const [studentResult, typeResult, paymentResult] = await Promise.all([
          supabase.from('students')
            .select('id, name, class, section, roll_no, parent_phone')
            .eq('school_id', profile.school_id)
            .order('name'),
          supabase.from('fee_types')
            .select('id, name, amount')
            .eq('school_id', profile.school_id)
            .order('name'),
          supabase.from('fee_records')
            .select('id, student_id, amount, payment_date, created_at')
            .eq('school_id', profile.school_id)
            .order('payment_date', { ascending: false }),
        ]);
        if (studentResult.error) throw studentResult.error;
        if (typeResult.error) throw typeResult.error;
        if (paymentResult.error) throw paymentResult.error;

        if (!cancelled) {
          setSchoolId(profile.school_id);
          setStudents((studentResult.data || []) as Student[]);
          setFeeTypes((typeResult.data || []) as FeeType[]);
          setPayments((paymentResult.data || []) as Payment[]);
        }
      } catch (loadError) {
        console.error('Fees load error', loadError);
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Fee information could not be loaded.');
      } finally {
        if (!cancelled) { setLoading(false); setRefreshing(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const expectedPerStudent = useMemo(
    () => feeTypes.reduce((sum, fee) => sum + Number(fee.amount || 0), 0),
    [feeTypes],
  );
  const monthPayments = useMemo(
    () => payments.filter((payment) => payment.payment_date?.startsWith(month)),
    [payments, month],
  );
  const balances = useMemo<StudentBalance[]>(() => students.map((student) => {
    const paid = monthPayments
      .filter((payment) => payment.student_id === student.id)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const due = Math.max(0, expectedPerStudent - paid);
    return {
      ...student, paid, due,
      status: expectedPerStudent > 0 && due === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid',
    };
  }), [students, monthPayments, expectedPerStudent]);

  const filtered = useMemo(() => balances.filter((student) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || student.name.toLowerCase().includes(query) ||
      (student.class || '').toLowerCase().includes(query) ||
      (student.parent_phone || '').includes(query);
    return matchesSearch && (status === 'All' || student.status === status);
  }), [balances, search, status]);

  const collected = monthPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const expected = expectedPerStudent * students.length;
  const outstanding = Math.max(0, expected - collected);
  const paidStudents = balances.filter((student) => student.status === 'Paid').length;

  const trend = useMemo(() => recentMonths(6).map((key) => ({
    month: monthLabel(key),
    collected: payments.filter((payment) => payment.payment_date?.startsWith(key))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  })), [payments]);

  async function createFee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId || !feeName.trim() || Number(feeAmount) <= 0) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const { error: insertError } = await supabase.from('fee_types').insert({
        school_id: schoolId, name: feeName.trim(), amount: Number(feeAmount),
      });
      if (insertError) throw insertError;
      setFeeModal(false); setFeeName(''); setFeeAmount('');
      setNotice('Fee structure added successfully.');
      setRefreshKey((value) => value + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Fee structure could not be added.');
    } finally { setSaving(false); }
  }

  function openPayment(student: StudentBalance) {
    setPaymentStudent(student);
    setPaymentAmount(student.due > 0 ? String(student.due) : '');
    setPaymentDate(todayNepal());
    setError(''); setNotice('');
  }

  async function recordPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId || !paymentStudent || Number(paymentAmount) <= 0 || !paymentDate) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const { error: insertError } = await supabase.from('fee_records').insert({
        school_id: schoolId,
        student_id: paymentStudent.id,
        amount: Number(paymentAmount),
        payment_date: paymentDate,
      });
      if (insertError) throw insertError;
      setPaymentStudent(null); setPaymentAmount('');
      setNotice(`Payment recorded for ${paymentStudent.name}.`);
      setMonth(paymentDate.slice(0, 7));
      setRefreshKey((value) => value + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Payment could not be recorded.');
    } finally { setSaving(false); }
  }

  function exportReport() {
    const rows = [['Month', 'Student', 'Class', 'Section', 'Parent phone', 'Expected', 'Paid', 'Due', 'Status']];
    filtered.forEach((student) => rows.push([
      month, student.name, student.class || '', student.section || '', student.parent_phone || '',
      String(expectedPerStudent), String(student.paid), String(student.due), student.status,
    ]));
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `fees-${month}.csv`; anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <FeesSkeleton />;
  if (!authenticated) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">Please sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in as principal to manage school fees.</p>
        <Link href="/auth/login?role=principal" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Go to login</Link>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">Finance workspace</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Fees</h1>
                <p className="mt-2 text-sm text-slate-500">Set school fees, collect payments and find outstanding dues.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={refreshing} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                </button>
                <button type="button" onClick={() => setFeeModal(true)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                  <Plus className="h-4 w-4" /> Add fee
                </button>
                <button type="button" onClick={exportReport} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
                  <Download className="h-4 w-4" /> Export
                </button>
              </div>
            </header>

            {(error || notice) && <div role={error ? 'alert' : 'status'} className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}{error || notice}
            </div>}

            <section className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Stat icon={Wallet} label="Expected this month" value={money(expected)} tone="blue" />
              <Stat icon={TrendingUp} label="Collected" value={money(collected)} tone="emerald" />
              <Stat icon={AlertCircle} label="Outstanding" value={money(outstanding)} tone="amber" />
              <Stat icon={Users} label="Fully paid students" value={`${paidStudents}/${students.length}`} tone="violet" />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.55fr)]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div><h2 className="font-bold text-slate-950">Collection trend</h2><p className="mt-1 text-xs text-slate-500">Actual payments from the last six months.</p></div>
                </div>
                <div className="mt-5 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)} />
                      <Tooltip formatter={(value) => money(Number(value || 0))} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} />
                      <Bar dataKey="collected" name="Collected" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-bold text-slate-950">Fee structure</h2>
                <p className="mt-1 text-xs text-slate-500">Fees expected from every student each month.</p>
                <div className="mt-4 divide-y divide-slate-100">
                  {feeTypes.map((fee) => <div key={fee.id} className="flex items-center justify-between gap-3 py-3"><span className="text-sm font-medium text-slate-700">{fee.name}</span><span className="text-sm font-bold text-slate-950">{money(Number(fee.amount || 0))}</span></div>)}
                  {!feeTypes.length && <div className="py-8 text-center"><FileText className="mx-auto h-6 w-6 text-slate-300" /><p className="mt-2 text-sm text-slate-500">No fee structure yet.</p><button type="button" onClick={() => setFeeModal(true)} className="mt-3 text-sm font-semibold text-blue-600">Add your first fee</button></div>}
                </div>
                {!!feeTypes.length && <div className="mt-3 flex justify-between border-t border-slate-200 pt-4 text-sm"><span className="font-semibold text-slate-600">Total per student</span><span className="font-bold text-slate-950">{money(expectedPerStudent)}</span></div>}
              </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
                <div className="mr-auto"><h2 className="font-bold text-slate-950">Student fee status</h2><p className="mt-1 text-xs text-slate-500">Monthly dues calculated from your fee structure and recorded payments.</p></div>
                <input type="month" value={month} max={currentMonth()} onChange={(event) => setMonth(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500" />
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Student, class or phone" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-56" />
                </label>
                <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500">
                  <option>All</option><option>Paid</option><option>Partial</option><option>Unpaid</option>
                </select>
              </div>

              {!students.length ? <EmptyStudents /> : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3 font-semibold">Student</th><th className="px-5 py-3 font-semibold">Expected</th><th className="px-5 py-3 font-semibold">Paid</th><th className="px-5 py-3 font-semibold">Due</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">{filtered.map((student) => <StudentRow key={student.id} student={student} expected={expectedPerStudent} onPay={openPayment} />)}</tbody>
                    </table>
                  </div>
                  <div className="divide-y divide-slate-100 md:hidden">{filtered.map((student) => <StudentCard key={student.id} student={student} expected={expectedPerStudent} onPay={openPayment} />)}</div>
                  {!filtered.length && <p className="px-5 py-12 text-center text-sm text-slate-500">No students match these filters.</p>}
                </>
              )}
            </section>
          </div>
        </main>
      </div>

      {feeModal && <Modal title="Add fee structure" description="This amount is included in each student's monthly expected fees." onClose={() => setFeeModal(false)}>
        <form onSubmit={createFee}><div className="space-y-4 p-6"><Field label="Fee name" value={feeName} onChange={setFeeName} placeholder="Monthly tuition fee" required /><Field label="Amount (NPR)" type="number" min="1" value={feeAmount} onChange={setFeeAmount} placeholder="1500" required /></div><ModalFooter saving={saving} label="Add fee" onCancel={() => setFeeModal(false)} /></form>
      </Modal>}

      {paymentStudent && <Modal title="Record payment" description={`${paymentStudent.name} · ${className(paymentStudent)}`} onClose={() => setPaymentStudent(null)}>
        <form onSubmit={recordPayment}><div className="space-y-4 p-6"><div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm"><div><p className="text-xs text-slate-500">Already paid</p><p className="mt-1 font-bold">{money(paymentStudent.paid)}</p></div><div><p className="text-xs text-slate-500">Current due</p><p className="mt-1 font-bold text-amber-700">{money(paymentStudent.due)}</p></div></div><Field label="Payment amount (NPR)" type="number" min="1" value={paymentAmount} onChange={setPaymentAmount} placeholder="Amount received" required /><Field label="Payment date" type="date" value={paymentDate} onChange={setPaymentDate} max={todayNepal()} required /></div><ModalFooter saving={saving} label="Save payment" onCancel={() => setPaymentStudent(null)} /></form>
      </Modal>}
    </div>
  );
}

function statusStyle(status: StudentBalance['status']) {
  return status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : status === 'Partial' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700';
}
function StudentRow({ student, expected, onPay }: { student: StudentBalance; expected: number; onPay: (student: StudentBalance) => void }) {
  return <tr className="hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{initials(student.name)}</span><div><p className="font-semibold text-slate-900">{student.name}</p><p className="text-xs text-slate-500">{className(student)} · Roll {student.roll_no || '—'}</p></div></div></td><td className="px-5 py-4 font-medium">{money(expected)}</td><td className="px-5 py-4 font-semibold text-emerald-700">{money(student.paid)}</td><td className="px-5 py-4 font-semibold text-amber-700">{money(student.due)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(student.status)}`}>{student.status}</span></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => onPay(student)} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">Record payment</button></td></tr>;
}
function StudentCard({ student, expected, onPay }: { student: StudentBalance; expected: number; onPay: (student: StudentBalance) => void }) {
  return <div className="p-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{initials(student.name)}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate font-semibold text-slate-900">{student.name}</p><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusStyle(student.status)}`}>{student.status}</span></div><p className="mt-1 text-xs text-slate-500">{className(student)}</p></div></div><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-400">Expected</p><p className="mt-1 font-bold">{money(expected)}</p></div><div className="rounded-lg bg-emerald-50 p-2"><p className="text-emerald-600">Paid</p><p className="mt-1 font-bold">{money(student.paid)}</p></div><div className="rounded-lg bg-amber-50 p-2"><p className="text-amber-600">Due</p><p className="mt-1 font-bold">{money(student.due)}</p></div></div><button type="button" onClick={() => onPay(student)} className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white">Record payment</button></div>;
}
function Stat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: 'blue' | 'emerald' | 'amber' | 'violet' }) {
  const colors = { blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-bold tabular-nums text-slate-950 sm:text-xl">{value}</p></div></div></div>;
}
function Modal({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6"><div><h2 className="text-xl font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button></div>{children}</div></div>;
}
function Field({ label, value, onChange, type = 'text', placeholder, required, min, max }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean; min?: string; max?: string }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} min={min} max={max} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>;
}
function ModalFooter({ saving, label, onCancel }: { saving: boolean; label: string; onCancel: () => void }) {
  return <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4"><button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Saving…' : label}</button></div>;
}
function EmptyStudents() {
  return <div className="px-6 py-14 text-center"><Users className="mx-auto h-8 w-8 text-slate-300" /><h3 className="mt-3 font-bold text-slate-900">No students added yet</h3><p className="mt-1 text-sm text-slate-500">Add students before recording fee payments.</p><Link href="/principal/students" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Open students</Link></div>;
}
function FeesSkeleton() {
  return <div className="min-h-screen bg-slate-50"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="px-4 pb-24 pt-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1500px] animate-pulse"><div className="h-24 border-b border-slate-200" /><div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 rounded-2xl bg-white" />)}</div><div className="mt-6 h-72 rounded-2xl bg-white" /><div className="mt-6 h-96 rounded-2xl bg-white" /></div></main></div></div>;
}
