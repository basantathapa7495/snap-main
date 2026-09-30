'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NepaliDate from 'nepali-date-converter';
import {
  AlertCircle, ArrowLeft, CalendarDays, Check, ChevronRight, Clock3, Download,
  FileText, Filter, Loader2, Plus, RefreshCw, Search, TrendingUp, Users, Wallet, X,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';
import { sectionKey } from '@/lib/principal-attendance';

type Student = {
  id: string;
  name: string;
  class: string | null;
  section: string | null;
  roll_no: string | null;
  parent_phone: string | null;
};
type FeeType = { id: string; name: string; amount: number | string | null; due_day: number | null };
type SavedClass = { class_name: string | null; class: string | null; name: string | null; class_number: string | null; section: string | null; section_name: string | null };
type ClassGroup = { key: string; label: string; students: Student[] };
type Payment = {
  id: string;
  student_id: string;
  amount: number | string | null;
  payment_date: string;
  receipt_number: string | null;
  created_at: string | null;
  fee_name: string;
};
type StudentBalance = Student & { paid: number; due: number; status: 'Paid' | 'Partial' | 'Due' | 'No fee'; lastPayment: Payment | null };

function todayNepal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
function currentMonth() { return todayNepal().slice(0, 7); }
function money(value: number) { return `Rs. ${Math.round(value).toLocaleString()}`; }
function initials(name: string) {
  return name.split(' ').filter(Boolean).map((word) => word[0]).join('').slice(0, 2).toUpperCase();
}
function className(student: Student) {
  return [student.class ? /^(class|grade)\s/i.test(student.class) ? student.class : `Class ${student.class}` : 'No class', student.section ? `Section ${student.section}` : ''].filter(Boolean).join(' · ');
}
function monthLabel(key: string) {
  return new Date(`${key}-01T12:00:00Z`).toLocaleDateString('en-US', { month: 'short' });
}
function recentMonths(count: number, end: string) {
  const result: string[] = [];
  const date = new Date(`${end}-01T12:00:00Z`);
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    result.push(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - offset, 1)).toISOString().slice(0, 7));
  }
  return result;
}
function nextMonth(month: string) {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString().slice(0, 7);
}
const PAGE_SIZE = 1000;
async function allRows<T>(query: (offset: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const result = await query(offset);
    if (result.error) throw new Error(result.error.message);
    rows.push(...result.data || []);
    if ((result.data || []).length < PAGE_SIZE) return rows;
  }
}
function dueDate(month: string, day: number) {
  const [year, monthNumber] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${month}-${String(Math.min(day, last)).padStart(2, '0')}`;
}

export default function FeesPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [savedClasses, setSavedClasses] = useState<SavedClass[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [classFilter, setClassFilter] = useState('All');
  const [activeClass, setActiveClass] = useState<string | null>(null);
  const [classTab, setClassTab] = useState<'Students' | 'Payments' | 'Dues' | 'Reports'>('Students');
  const [trendMonths, setTrendMonths] = useState<6 | 12>(12);
  const [studentDetail, setStudentDetail] = useState<StudentBalance | null>(null);
  const [studentPage, setStudentPage] = useState(1);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [showAllDueDates, setShowAllDueDates] = useState(false);
  const [showAllClasses, setShowAllClasses] = useState(false);
  const [duesModal, setDuesModal] = useState(false);
  const [dueDays, setDueDays] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'All' | 'Paid' | 'Partial' | 'Due' | 'No fee'>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [feeModal, setFeeModal] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<StudentBalance | null>(null);
  const [paymentDetail, setPaymentDetail] = useState<Payment | null>(null);
  const [paymentPickerOpen, setPaymentPickerOpen] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeDueDay, setFeeDueDay] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayNepal());

  useEffect(() => {
    if (!loading && window.location.hash === '#dues') {
      document.getElementById('dues')?.scrollIntoView({ block: 'start' });
    }
  }, [loading]);

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
          .from('profiles').select('school_id,role').eq('user_id', user.id).single();
        if (profileError || !profile?.school_id || profile.role !== 'admin') throw new Error('Principal school access could not be loaded.');

        const academicYear = Number(new NepaliDate(new Date()).format('YYYY'));
        const [studentRows, classRows, typeRows, paymentRows] = await Promise.all([
          allRows<Student>((offset) => supabase.from('students')
            .select('id, name, class, section, roll_no, parent_phone')
            .eq('school_id', profile.school_id)
            .order('id').range(offset, offset + PAGE_SIZE - 1)),
          allRows<SavedClass>((offset) => supabase.from('classes')
            .select('class_name,class,name,class_number,section,section_name')
            .eq('school_id', profile.school_id).eq('academic_year', academicYear).is('archived_at', null)
            .order('id').range(offset, offset + PAGE_SIZE - 1)),
          allRows<FeeType>((offset) => supabase.from('fee_types')
            .select('id,name,amount,due_day')
            .eq('school_id', profile.school_id)
            .order('id').range(offset, offset + PAGE_SIZE - 1)),
          allRows<Payment>((offset) => supabase.from('fee_records')
            .select('id,student_id,amount,payment_date,receipt_number,created_at,fee_name')
            .eq('school_id', profile.school_id)
            .order('payment_date', { ascending: false }).order('id').range(offset, offset + PAGE_SIZE - 1)),
        ]);
        const paymentId = new URLSearchParams(window.location.search).get('payment');
        const detailResult = paymentId ? await supabase.from('fee_records').select('id,student_id,amount,payment_date,receipt_number,created_at,fee_name')
          .eq('school_id', profile.school_id).eq('id', paymentId).maybeSingle() : null;
        if (detailResult?.error) throw detailResult.error;

        if (!cancelled) {
          setSchoolId(profile.school_id);
          setStudents(studentRows);
          setSavedClasses(classRows);
          setFeeTypes(typeRows);
          setDueDays(Object.fromEntries(typeRows.map((fee) => [fee.id, fee.due_day?.toString() || ''])));
          setPayments(paymentRows);
          if (paymentId) {
            setPaymentDetail((detailResult?.data || null) as Payment | null);
            window.history.replaceState(window.history.state, '', window.location.pathname);
          }
          if (new URLSearchParams(window.location.search).get('action') === 'record') {
            setPaymentSearch('');
            setPaymentPickerOpen(true);
            window.history.replaceState(window.history.state, '', window.location.pathname);
          }
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
  const groups = useMemo(() => {
    const map = new Map<string, ClassGroup>();
    const configuredSections = new Set(savedClasses.filter((row) => row.section_name || row.section).map((row) => sectionKey(row.class_name || row.class || row.name || row.class_number, null)));
    for (const row of savedClasses) {
      const grade = (row.class_name || row.class || row.name || row.class_number || '').trim();
      if (!grade) continue;
      const section = (row.section_name || row.section || '').trim().replace(/^section\s+/i, '').toUpperCase();
      if (!section && configuredSections.has(sectionKey(grade, null))) continue;
      const key = sectionKey(grade, section);
      const label = `${/^(class|grade)\s/i.test(grade) ? grade : `Class ${grade}`}${section ? ` (${section})` : ''}`;
      if (!map.has(key)) map.set(key, { key, label, students: [] });
    }
    for (const student of students) {
      const key = sectionKey(student.class, student.section);
      if (!map.has(key)) map.set(key, { key, label: className(student).replace(' · Section ', ' (' ) + (student.section ? ')' : ''), students: [] });
      map.get(key)!.students.push(student);
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }, [savedClasses, students]);
  const monthPayments = useMemo(
    () => payments.filter((payment) => payment.payment_date?.startsWith(month)),
    [payments, month],
  );
  const balances = useMemo<StudentBalance[]>(() => students.map((student) => {
    const studentPayments = monthPayments.filter((payment) => payment.student_id === student.id);
    const paid = studentPayments
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const due = Math.max(0, expectedPerStudent - paid);
    return {
      ...student, paid, due, lastPayment: studentPayments[0] || null,
      status: expectedPerStudent === 0 ? 'No fee' : due === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Due',
    };
  }), [students, monthPayments, expectedPerStudent]);

  const visibleBalances = useMemo(() => balances.filter((student) => classFilter === 'All' || sectionKey(student.class, student.section) === classFilter), [balances, classFilter]);
  const activeGroup = groups.find((group) => group.key === activeClass);
  const classBalances = useMemo(() => balances.filter((student) => activeClass !== null && sectionKey(student.class, student.section) === activeClass), [balances, activeClass]);
  const filtered = useMemo(() => (activeClass ? classBalances : visibleBalances).filter((student) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || student.name.toLowerCase().includes(query) ||
      (student.roll_no || '').toLowerCase().includes(query) ||
      (student.class || '').toLowerCase().includes(query);
    return matchesSearch && (status === 'All' || student.status === status);
  }), [activeClass, classBalances, visibleBalances, search, status]);
  const paymentOptions = balances.filter((student) => `${student.name} ${student.class || ''} ${student.parent_phone || ''}`.toLowerCase().includes(paymentSearch.trim().toLowerCase()));

  const visibleIds = new Set(visibleBalances.map((student) => student.id));
  const collected = monthPayments.filter((payment) => visibleIds.has(payment.student_id)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const expected = expectedPerStudent * visibleBalances.length;
  const dueExpected = feeTypes.filter((fee) => fee.due_day && dueDate(month, fee.due_day) < todayNepal()).reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
  const overdue = month <= currentMonth() ? visibleBalances.reduce((sum, student) => sum + Math.max(0, dueExpected - student.paid), 0) : 0;
  const classCounts = { Paid: classBalances.filter((student) => student.status === 'Paid').length, Due: classBalances.filter((student) => student.status === 'Due').length, Partial: classBalances.filter((student) => student.status === 'Partial').length };
  const recent = monthPayments.filter((payment) => visibleIds.has(payment.student_id));
  const upcoming = [month, nextMonth(month)].flatMap((dueMonth) => feeTypes.filter((fee) => fee.due_day).map((fee) => ({ fee, date: dueDate(dueMonth, fee.due_day!) }))).filter((item) => item.date >= todayNepal()).sort((a, b) => a.date.localeCompare(b.date));

  const trend = useMemo(() => recentMonths(trendMonths, month).map((key) => ({
    month: monthLabel(key),
    collected: payments.filter((payment) => payment.payment_date?.startsWith(key) && (classFilter === 'All' || students.some((student) => student.id === payment.student_id && sectionKey(student.class, student.section) === classFilter)))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    expected: expectedPerStudent * (classFilter === 'All' ? students.length : students.filter((student) => sectionKey(student.class, student.section) === classFilter).length),
  })), [payments, trendMonths, month, classFilter, students, expectedPerStudent]);

  async function createFee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId || !feeName.trim() || Number(feeAmount) <= 0) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const { error: insertError } = await supabase.from('fee_types').insert({
        school_id: schoolId, name: feeName.trim(), amount: Number(feeAmount), due_day: feeDueDay ? Number(feeDueDay) : null,
      });
      if (insertError) throw insertError;
      setFeeModal(false); setFeeName(''); setFeeAmount(''); setFeeDueDay('');
      setNotice('Fee structure added successfully.');
      setRefreshKey((value) => value + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Fee structure could not be added.');
    } finally { setSaving(false); }
  }

  async function saveDueDays(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId) return;
    setSaving(true); setError('');
    try {
      for (const fee of feeTypes) {
        const value = dueDays[fee.id]?.trim() || '';
        if (value && (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 31)) throw new Error('Due day must be between 1 and 31.');
        const due_day = value ? Number(value) : null;
        if (due_day === fee.due_day) continue;
        const { error: updateError } = await supabase.from('fee_types').update({ due_day }).eq('id', fee.id).eq('school_id', schoolId);
        if (updateError) throw updateError;
      }
      setDuesModal(false); setNotice('Due dates saved.'); setRefreshKey((value) => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Due dates could not be saved.'); }
    finally { setSaving(false); }
  }

  function openPayment(student: StudentBalance) {
    setPaymentPickerOpen(false);
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
        student_name: paymentStudent.name,
        fee_name: 'Fee payment',
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
    const csv = rows.map((row) => row.map((cell) => { const value = String(cell); return `"${(/^[=+@-]/.test(value) ? "'" : '') + value.replaceAll('"', '""')}"`; }).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `fees-${month}.csv`; anchor.click();
    URL.revokeObjectURL(url);
  }
  function downloadReceipt(payment: Payment) {
    const student = students.find((item) => item.id === payment.student_id);
    const content = [
      'NEPSOM · Payment receipt',
      'Reference: ' + (payment.receipt_number || payment.id),
      'Student: ' + (student?.name || 'Student'),
      'Class: ' + (student ? className(student) : '—'),
      'Fee: ' + payment.fee_name,
      'Paid: ' + money(Number(payment.amount || 0)),
      'Date: ' + payment.payment_date,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'receipt-' + (payment.receipt_number || payment.id.slice(0, 8)) + '.txt'; anchor.click(); URL.revokeObjectURL(url);
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

  const studentById = new Map(students.map((student) => [student.id, student]));
  const selectedPayments = monthPayments.filter((payment) => activeGroup?.students.some((student) => student.id === payment.student_id)).sort((a, b) => b.payment_date.localeCompare(a.payment_date));
  const classExpected = expectedPerStudent * classBalances.length;
  const classCollected = classBalances.reduce((sum, student) => sum + student.paid, 0);
  const classDue = classBalances.reduce((sum, student) => sum + student.due, 0);
  const rate = expected ? Math.min(100, Math.round(collected / expected * 100)) : null;
  const displayedStudents = (classTab === 'Dues' ? filtered.filter((student) => student.due > 0) : filtered);
  const pageCount = Math.max(1, Math.ceil(displayedStudents.length / 10));
  const currentPage = Math.min(studentPage, pageCount);
  const pagedStudents = displayedStudents.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-950 dark:bg-slate-950 dark:text-white">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-3.5 pb-28 pt-7 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1500px] space-y-4">
            {activeGroup ? (
              <header className="flex items-center gap-3 rounded-xl bg-white px-2 py-3 dark:bg-slate-900">
                <button type="button" onClick={() => { setActiveClass(null); setSearch(''); setStatus('All'); }} aria-label="Back to fees overview" className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeft className="h-5 w-5" /></button>
                <div className="min-w-0"><h1 className="text-lg font-bold">Fees</h1><p className="text-xs text-slate-500 dark:text-slate-400">{activeGroup.label} · {activeGroup.students.length} students</p></div>
              </header>
            ) : (
              <header className="relative -mx-3.5 flex min-h-[112px] items-center overflow-hidden bg-gradient-to-br from-[#e7f2ff] via-[#f5faff] to-[#9dbcf4] px-4 py-3 dark:from-[#132a49] dark:via-[#182d49] dark:to-[#1b365b] sm:mx-0 sm:min-h-[160px] sm:rounded-2xl sm:border sm:border-blue-100 sm:px-8 sm:py-8 sm:dark:border-blue-900/60">
                <div className="relative z-10 max-w-[65%]"><h1 className="text-[1.7rem] font-extrabold tracking-tight sm:text-4xl">Fees</h1><p className="mt-1 text-xs leading-4 text-slate-800 dark:text-blue-100 min-[420px]:text-sm sm:text-base">Manage student fees, payments and dues across your school.</p></div>
                <Wallet className="pointer-events-none absolute -right-3 bottom-[-22px] h-32 w-32 rotate-[-8deg] text-blue-400/25 dark:text-blue-300/15 sm:right-7 sm:h-40 sm:w-40" aria-hidden="true" />
              </header>
            )}
            {(error || notice) && <p role={error ? 'alert' : 'status'} className={'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ' + (error ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300')}>{error ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}{error || notice}</p>}

            {activeGroup ? <>
              <nav aria-label="Class fee sections" className="grid grid-cols-4 rounded-xl border border-slate-200 bg-white px-1 dark:border-slate-700 dark:bg-slate-900">{(['Students', 'Payments', 'Dues', 'Reports'] as const).map((tab) => <button key={tab} type="button" onClick={() => { setClassTab(tab); setStudentPage(1); }} className={'border-b-2 px-1 py-3 text-[11px] font-semibold sm:text-sm ' + (classTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 dark:text-slate-400')}>{tab}</button>)}</nav>
              <section aria-label="Class fee summary" className="grid grid-cols-4 gap-1.5 sm:gap-3">
                <FeeStat icon={Wallet} label="Paid" value={String(classCounts.Paid)} tone="emerald" />
                <FeeStat icon={AlertCircle} label="Due" value={String(classCounts.Due)} tone="rose" />
                <FeeStat icon={Clock3} label="Partial" value={String(classCounts.Partial)} tone="amber" />
                <FeeStat icon={Users} label="Total" value={String(classBalances.length)} tone="blue" />
              </section>
              {(classTab === 'Students' || classTab === 'Dues') && <>
                <div className="flex gap-2"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"><Search className="h-4 w-4 shrink-0 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setStudentPage(1); }} placeholder="Search by name or roll number..." className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></label><select aria-label="Fee status" value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setStudentPage(1); }} className="h-10 max-w-24 rounded-xl border border-slate-200 bg-white px-1 text-xs dark:border-slate-700 dark:bg-slate-900"><option>All</option><option>Paid</option><option>Due</option><option>Partial</option><option>No fee</option></select></div>
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
                  {pagedStudents.map((student) => <button key={student.id} type="button" onClick={() => setStudentDetail(student)} className="flex w-full items-center gap-2 border-b border-slate-100 py-3 text-left last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">{initials(student.name)}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{student.name}</strong><span className="text-[10px] text-slate-500 dark:text-slate-400">Roll {student.roll_no || '—'}</span></span><span className={'rounded-full px-2 py-1 text-[10px] font-semibold ' + statusStyle(student.status)}>{student.status}</span><span className="min-w-16 text-right"><strong className="block text-[11px]">{money(student.paid || expectedPerStudent)}</strong><span className="block text-[9px] text-slate-500 dark:text-slate-400">{student.status === 'Partial' ? 'Remaining ' + money(student.due) : student.lastPayment ? student.lastPayment.payment_date : feeTypes.find((fee) => fee.due_day) ? 'Due ' + dueDate(month, feeTypes.find((fee) => fee.due_day)!.due_day!) : 'No due date'}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-slate-400" /></button>)}
                  {!displayedStudents.length && <p className="py-8 text-center text-xs text-slate-500">{classBalances.length ? 'No students match these filters.' : 'No students are assigned to this class.'}</p>}
                </section>
                {displayedStudents.length > 10 && <div className="flex items-center justify-between text-[10px] text-slate-500"><span>Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, displayedStudents.length)} of {displayedStudents.length} students</span><span className="flex gap-2"><button type="button" disabled={currentPage === 1} onClick={() => setStudentPage(currentPage - 1)} className="rounded-lg border px-2 py-1 disabled:opacity-40">Previous</button><button type="button" disabled={currentPage === pageCount} onClick={() => setStudentPage(currentPage + 1)} className="rounded-lg border px-2 py-1 disabled:opacity-40">Next</button></span></div>}
                <button type="button" onClick={() => { setPaymentSearch(''); setPaymentPickerOpen(true); }} disabled={!classBalances.length} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" />Record payment for a student</button>
              </>}
              {classTab === 'Payments' && <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold">Payments · {month}</h2><button onClick={exportReport} className="text-xs font-semibold text-blue-600">Export</button></div>{selectedPayments.map((payment) => <button key={payment.id} type="button" onClick={() => setPaymentDetail(payment)} className="flex w-full items-center justify-between border-t border-slate-100 py-2 text-left text-xs dark:border-slate-800"><span>{studentById.get(payment.student_id)?.name || 'Student'}<small className="block text-slate-500">{payment.payment_date} · {payment.fee_name}</small></span><strong className="text-emerald-600">{money(Number(payment.amount || 0))}</strong></button>)}{!selectedPayments.length && <p className="py-8 text-center text-xs text-slate-500">No payments recorded for this class this month.</p>}</section>}
              {classTab === 'Reports' && <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-700 dark:bg-slate-900"><h2 className="text-sm font-bold">Class report · {month}</h2><p>Expected: <strong>{money(classExpected)}</strong></p><p>Collected: <strong>{money(classCollected)}</strong></p><p>Pending: <strong>{money(classDue)}</strong></p><p>Collection rate: <strong>{classExpected ? Math.min(100, Math.round(classCollected / classExpected * 100)) + '%' : '—'}</strong></p><button type="button" onClick={exportReport} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white"><Download className="h-3.5 w-3.5" />Export CSV</button></section>}
            </> : <>
              <section aria-label="Fees overview" className="grid grid-cols-4 gap-1.5 sm:gap-3">
                <FeeStat icon={Wallet} label="Collected" value={money(collected)} tone="emerald" />
                <FeeStat icon={FileText} label="Expected" value={money(expected)} tone="blue" />
                <FeeStat icon={AlertCircle} label="Overdue" value={feeTypes.some((fee) => fee.due_day) ? money(overdue) : '—'} tone="rose" />
                <FeeStat icon={TrendingUp} label="Collection rate" value={rate === null ? '—' : rate + '%'} tone="violet" />
              </section>
              <div className="grid grid-cols-2 gap-2 sm:max-w-xl"><label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-slate-900"><CalendarDays className="h-4 w-4 shrink-0 text-slate-500" /><input aria-label="Month" type="month" value={month} max={currentMonth()} onChange={(event) => setMonth(event.target.value)} className="min-w-0 w-full bg-transparent text-xs outline-none dark:[color-scheme:dark]" /></label><label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-slate-900"><Filter className="h-4 w-4 shrink-0 text-slate-500" /><select aria-label="Class and section" value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="min-w-0 w-full bg-transparent text-xs outline-none"><option value="All">All classes</option>{groups.map((group) => <option key={group.key} value={group.key}>{group.label}</option>)}</select></label></div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 sm:max-w-xl"><button type="button" onClick={() => { setPaymentSearch(''); setPaymentPickerOpen(true); }} className="flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl bg-blue-600 px-2 text-[10px] font-semibold text-white sm:text-xs"><Plus className="h-4 w-4" />Record payment</button><button type="button" onClick={() => setDuesModal(true)} className="flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-semibold dark:border-slate-700 dark:bg-slate-900 sm:text-xs"><Clock3 className="h-4 w-4" />Manage dues</button><button type="button" onClick={exportReport} className="flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-semibold dark:border-slate-700 dark:bg-slate-900 sm:text-xs"><Download className="h-4 w-4" />Export</button></div>
              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center justify-between gap-2"><div><h2 className="text-sm font-bold">Monthly collection</h2><p className="text-[10px] text-slate-500">Expected uses current fee structure and enrollment.</p></div><select aria-label="Chart period" value={trendMonths} onChange={(event) => setTrendMonths(Number(event.target.value) as 6 | 12)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] dark:border-slate-700 dark:bg-slate-900"><option value={12}>12 months</option><option value={6}>6 months</option></select></div>{feeTypes.length && students.length ? <div className="mt-3 h-48 sm:h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{ top: 6, right: 0, bottom: 0, left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.5} /><XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={trendMonths === 12 ? 1 : 0} /><YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(value: number) => value >= 1000 ? Math.round(value / 1000) + 'k' : String(value)} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => money(Number(value || 0))} /><Bar dataKey="collected" name="Collected" fill="#10b981" radius={[3, 3, 0, 0]} /><Bar dataKey="expected" name="Expected" fill="#bfdbfe" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div> : <p className="py-8 text-center text-xs text-slate-500">Add students and a fee structure to see collection trends.</p>}</section>
              <div className="grid gap-3 md:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><div className="flex justify-between"><h2 className="text-sm font-bold">Recent payments</h2><button type="button" onClick={() => setShowAllPayments((value) => !value)} className="text-xs font-semibold text-blue-600">{showAllPayments ? 'Show less' : 'View all'}</button></div>{(showAllPayments ? recent : recent.slice(0, 3)).map((payment) => <button key={payment.id} type="button" onClick={() => setPaymentDetail(payment)} className="flex w-full items-center gap-2 border-b border-slate-100 py-2 text-left last:border-b-0 dark:border-slate-800"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold text-blue-600 dark:bg-blue-900/40">{initials(studentById.get(payment.student_id)?.name || 'Student')}</span><span className="min-w-0 flex-1"><strong className="block truncate text-[11px]">{studentById.get(payment.student_id)?.name || 'Student'}</strong><span className="block text-[9px] text-slate-500">{studentById.get(payment.student_id) ? className(studentById.get(payment.student_id)!) : payment.payment_date}</span></span><span className="text-right"><strong className="block text-[11px] text-emerald-600">{money(Number(payment.amount || 0))}</strong><span className="block text-[9px] text-slate-500">{payment.payment_date}</span></span></button>)}{!recent.length && <p className="py-5 text-center text-xs text-slate-500">No payments recorded in this month.</p>}</section>
                <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><div className="flex justify-between"><h2 className="text-sm font-bold">Upcoming due dates</h2><button type="button" onClick={() => setShowAllDueDates((value) => !value)} className="text-xs font-semibold text-blue-600">{showAllDueDates ? 'Show less' : 'View all'}</button></div>{(showAllDueDates ? upcoming : upcoming.slice(0, 3)).map(({ fee, date }) => <div key={fee.id + date} className="flex items-center gap-3 border-b border-slate-100 py-2 text-xs last:border-b-0 dark:border-slate-800"><span className="rounded-lg bg-rose-50 px-2 py-1 text-center text-rose-600 dark:bg-rose-900/30"><small className="block text-[9px]">{monthLabel(date.slice(0, 7))}</small><strong>{date.slice(-2)}</strong></span><span className="min-w-0 flex-1"><strong className="block truncate">{fee.name}</strong><small className="text-slate-500">{visibleBalances.length} students · {money(Number(fee.amount || 0))} each</small></span></div>)}{!upcoming.length && <p className="py-5 text-center text-xs text-slate-500">{feeTypes.some((fee) => fee.due_day) ? 'No upcoming due dates this month.' : 'No due dates configured. Use Manage dues to set them.'}</p>}</section>
              </div>
              <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><div className="mb-2 flex justify-between"><h2 className="text-sm font-bold">Class-wise collection</h2><button type="button" onClick={() => setShowAllClasses((value) => !value)} className="text-xs font-semibold text-blue-600">{showAllClasses ? 'Show less' : 'View all'}</button></div><div id="class-fees" className="divide-y divide-slate-100 dark:divide-slate-800">{groups.filter((group) => classFilter === 'All' || classFilter === group.key).slice(0, showAllClasses ? undefined : 6).map((group) => { const entries = balances.filter((student) => sectionKey(student.class, student.section) === group.key); const received = entries.reduce((sum, student) => sum + student.paid, 0); const pending = entries.reduce((sum, student) => sum + student.due, 0); const denominator = expectedPerStudent * entries.length; const percentage = denominator ? Math.min(100, Math.round(received / denominator * 100)) : null; return <button key={group.key} type="button" onClick={() => { setActiveClass(group.key); setClassTab('Students'); setSearch(''); setStatus('All'); }} className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 py-2 text-left text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800"><span className="truncate font-semibold">{group.label}<small className="block font-normal text-slate-500">{entries.length} students</small></span><span className="text-right"><strong className="block text-emerald-600">{money(received)}</strong><small className="text-rose-500">Pending {money(pending)}</small></span><span className="w-14 text-right"><strong>{percentage === null ? '—' : percentage + '%'}</strong><span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><span className="block h-full rounded-full bg-emerald-500" style={{ width: (percentage || 0) + '%' }} /></span></span></button>; })}{!groups.length && <p className="py-6 text-center text-xs text-slate-500">No classes or students yet.</p>}</div></section>
              <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setFeeModal(true)} className="text-xs font-semibold text-blue-600">+ Add fee structure</button><button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={refreshing} className="inline-flex items-center gap-1 text-xs text-slate-500"><RefreshCw className={'h-3 w-3 ' + (refreshing ? 'animate-spin' : '')} />Refresh</button></div>
            </>}
          </div>
        </main>
      </div>

      {paymentDetail && <Modal title="Payment receipt" description={students.find((student) => student.id === paymentDetail.student_id)?.name || 'Student payment'} onClose={() => setPaymentDetail(null)}><dl className="grid gap-3 p-5 text-sm"><div><dt className="text-xs text-slate-500">Amount received</dt><dd className="font-bold text-emerald-700">{money(Number(paymentDetail.amount || 0))}</dd></div><div><dt className="text-xs text-slate-500">Fee</dt><dd>{paymentDetail.fee_name}</dd></div><div><dt className="text-xs text-slate-500">Payment date</dt><dd>{paymentDetail.payment_date}</dd></div><div><dt className="text-xs text-slate-500">Reference</dt><dd>{paymentDetail.receipt_number || paymentDetail.id}</dd></div></dl><div className="border-t border-slate-100 p-4 dark:border-slate-700"><button type="button" onClick={() => downloadReceipt(paymentDetail)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Download receipt</button></div></Modal>}
      {studentDetail && <Modal title={studentDetail.name} description={className(studentDetail) + ' · Roll ' + (studentDetail.roll_no || '—')} onClose={() => setStudentDetail(null)}><div className="max-h-[70dvh] space-y-3 overflow-y-auto p-5 text-xs"><div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><div><small className="text-slate-500">Expected</small><strong className="block">{money(expectedPerStudent)}</strong></div><div><small className="text-slate-500">Paid</small><strong className="block text-emerald-600">{money(studentDetail.paid)}</strong></div><div><small className="text-slate-500">Remaining</small><strong className="block text-rose-600">{money(studentDetail.due)}</strong></div></div><h3 className="font-bold">Payment history</h3>{payments.filter((payment) => payment.student_id === studentDetail.id).map((payment) => <button key={payment.id} type="button" onClick={() => { setStudentDetail(null); setPaymentDetail(payment); }} className="flex w-full justify-between border-t border-slate-100 py-2 text-left dark:border-slate-700"><span>{payment.payment_date}<small className="block text-slate-500">{payment.fee_name} · {payment.receipt_number || payment.id.slice(0, 8)}</small></span><strong className="text-emerald-600">{money(Number(payment.amount || 0))}</strong></button>)}{!payments.some((payment) => payment.student_id === studentDetail.id) && <p className="text-slate-500">No payments recorded this month.</p>}<button type="button" onClick={() => { const student = studentDetail; setStudentDetail(null); openPayment(student); }} className="w-full rounded-xl bg-blue-600 py-2.5 font-semibold text-white">Record payment</button></div></Modal>}
      {duesModal && <Modal title="Manage dues" description="Set the monthly due day for each fee type." onClose={() => setDuesModal(false)}><form onSubmit={saveDueDays}><div className="max-h-[60dvh] space-y-3 overflow-y-auto p-5">{feeTypes.map((fee) => <label key={fee.id} className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 flex-1"><strong className="block truncate">{fee.name}</strong><small className="text-slate-500">{money(Number(fee.amount || 0))} per student</small></span><input aria-label={'Due day for ' + fee.name} type="number" min="1" max="31" value={dueDays[fee.id] || ''} onChange={(event) => setDueDays((days) => ({ ...days, [fee.id]: event.target.value }))} placeholder="Day" className="h-9 w-16 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-800" /></label>)}{!feeTypes.length && <p className="text-center text-xs text-slate-500">Add a fee type before setting due dates.</p>}{error && <p role="alert" className="text-xs text-rose-600">{error}</p>}<p className="text-[10px] text-slate-500">Leave blank if a fee has no scheduled due date. Days beyond a month’s end use its last day.</p><button type="button" onClick={() => { setDuesModal(false); setFeeModal(true); }} className="text-xs font-semibold text-blue-600">+ Add fee type</button></div><ModalFooter saving={saving} label="Save due dates" onCancel={() => setDuesModal(false)} /></form></Modal>}
      {paymentPickerOpen && <Modal title="Record a student payment" description="Choose the student who made the payment." onClose={() => setPaymentPickerOpen(false)}>
        <div className="p-5"><label className="block text-sm font-semibold">Find student<input autoFocus value={paymentSearch} onChange={(event) => setPaymentSearch(event.target.value)} placeholder="Search name, class or phone" className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800" /></label>
          <div className="mt-3 max-h-[min(50dvh,360px)] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
            {paymentOptions.filter((student) => !activeClass || sectionKey(student.class, student.section) === activeClass).map((student) => <button key={student.id} type="button" onClick={() => openPayment(student)} className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-emerald-50 dark:border-slate-700 dark:hover:bg-slate-800"><span className="min-w-0 truncate font-semibold">{student.name}<span className="ml-2 text-xs font-normal text-slate-500">{className(student)}</span></span><span className="shrink-0 font-semibold text-emerald-700">Select →</span></button>)}
            {!paymentOptions.length && <p className="p-4 text-center text-sm text-slate-500">No students found. Add a student before recording a payment.</p>}
          </div>
        </div>
      </Modal>}
      {feeModal && <Modal title="Add fee structure" description="This amount is included in each student's monthly expected fees." onClose={() => setFeeModal(false)}>
        <form onSubmit={createFee}><div className="space-y-4 p-5"><Field label="Fee name" value={feeName} onChange={setFeeName} placeholder="Monthly tuition fee" required /><Field label="Amount (NPR)" type="number" min="1" value={feeAmount} onChange={setFeeAmount} placeholder="1500" required /><Field label="Monthly due day (optional)" type="number" min="1" max="31" value={feeDueDay} onChange={setFeeDueDay} placeholder="5" /></div><ModalFooter saving={saving} label="Add fee" onCancel={() => setFeeModal(false)} /></form>
      </Modal>}

      {paymentStudent && <Modal title="Record payment" description={`${paymentStudent.name} · ${className(paymentStudent)}`} onClose={() => setPaymentStudent(null)}>
        <form onSubmit={recordPayment}><div className="space-y-3 p-5"><div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800"><div><p className="text-slate-500">Already paid</p><p className="mt-1 font-bold">{money(paymentStudent.paid)}</p></div><div><p className="text-slate-500">Current due</p><p className="mt-1 font-bold text-amber-700">{money(paymentStudent.due)}</p></div></div><Field label="Payment amount (NPR)" type="number" min="1" value={paymentAmount} onChange={setPaymentAmount} placeholder="Amount received" required /><Field label="Payment date" type="date" value={paymentDate} onChange={setPaymentDate} max={todayNepal()} required />{error && <p role="alert" className="text-xs text-rose-600">{error}</p>}</div><ModalFooter saving={saving} label="Save payment" onCancel={() => setPaymentStudent(null)} /></form>
      </Modal>}
    </div>
  );
}

function statusStyle(status: StudentBalance['status']) {
  return status === 'Paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : status === 'Partial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : status === 'Due' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
}
function FeeStat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' }) {
  const colors = { blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30', emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30', rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30', violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30' };
  return <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-1 py-2 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-3"><span className={'mx-auto flex h-7 w-7 items-center justify-center rounded-lg ' + colors[tone]}><Icon className="h-4 w-4" /></span><strong className="mt-1 block truncate text-[11px] font-extrabold leading-none sm:text-lg">{value}</strong><span className="mt-1 block min-h-5 text-[9px] leading-[10px] text-slate-500 dark:text-slate-400 sm:min-h-0 sm:text-xs">{label}</span></div>;
}
function Modal({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-2 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-2xl bg-white text-slate-950 shadow-2xl dark:bg-slate-900 dark:text-white"><div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4 dark:border-slate-700"><div><h2 className="text-lg font-bold">{title}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><X className="h-5 w-5" /></button></div>{children}</div></div>;
}
function Field({ label, value, onChange, type = 'text', placeholder, required, min, max }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean; min?: string; max?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">{label}{required && <span className="text-red-500"> *</span>}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} min={min} max={max} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark]" /></label>;
}
function ModalFooter({ saving, label, onCancel }: { saving: boolean; label: string; onCancel: () => void }) {
  return <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-700"><button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Saving…' : label}</button></div>;
}
function FeesSkeleton() {
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="px-3.5 pb-24 pt-7 sm:px-6 lg:pt-24"><div className="mx-auto max-w-[1500px] animate-pulse"><div className="h-28 rounded-xl bg-blue-50 dark:bg-slate-900" /><div className="mt-3 grid grid-cols-4 gap-1.5">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-20 rounded-xl bg-white dark:bg-slate-900" />)}</div><div className="mt-3 h-48 rounded-xl bg-white dark:bg-slate-900" /></div></main></div></div>;
}
