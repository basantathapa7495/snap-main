'use client';

import { useEffect, useState, type ElementType } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Globe,
  GraduationCap,
  Megaphone,
  Plus,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

type Profile = {
  full_name: string | null;
  school_id: string;
};

type SchoolRecord = {
  name: string | null;
  slug: string | null;
};

type StudentRecord = {
  id: string;
  name: string;
  class: string | null;
  section: string | null;
  created_at: string | null;
};

type AttendanceRecord = {
  student_id: string | null;
  attendance_date: string;
  status: string;
};

type FeeRecord = {
  student_id: string | null;
  amount: number | string | null;
  payment_date: string;
};

type ExamRecord = {
  id: string;
  name: string;
  start_date: string | null;
};

type EventRecord = {
  id: string;
  title: string;
  event_date: string | null;
  event_time: string | null;
};

type AttendancePoint = {
  day: string;
  date: string;
  attendance: number;
};

type ScheduleItem = {
  id: string;
  title: string;
  date: string;
  time: string | null;
  type: 'Exam' | 'Event';
};

type AttentionData = {
  icon: ElementType;
  title: string;
  description: string;
  href: string;
  action: string;
  tone: 'amber' | 'red' | 'orange' | 'blue';
};

type DashboardData = {
  profile: Profile | null;
  school: SchoolRecord | null;
  students: number;
  teachers: number;
  classes: number;
  todayAttendance: number;
  yesterdayAttendance: number;
  feesCollected: number;
  paidStudents: number;
  pendingAdmissions: number;
  lowAttendance: number;
  upcomingExams: number;
  attendanceTrend: AttendancePoint[];
  recentStudents: StudentRecord[];
  schedule: ScheduleItem[];
};

const initialData: DashboardData = {
  profile: null,
  school: null,
  students: 0,
  teachers: 0,
  classes: 0,
  todayAttendance: 0,
  yesterdayAttendance: 0,
  feesCollected: 0,
  paidStudents: 0,
  pendingAdmissions: 0,
  lowAttendance: 0,
  upcomingExams: 0,
  attendanceTrend: [],
  recentStudents: [],
  schedule: [],
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function attendanceRate(records: AttendanceRecord[]) {
  const marked = records.filter((record) => record.status !== 'unmarked');
  if (marked.length === 0) return 0;
  const present = marked.filter(
    (record) => record.status === 'present' || record.status === 'late'
  ).length;
  return Math.round((present / marked.length) * 100);
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function PrincipalDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          if (!cancelled) setAuthenticated(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, school_id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profileData?.school_id) {
          throw new Error('Your school profile could not be loaded.');
        }

        const profile = profileData as Profile;
        const schoolId = profile.school_id;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const sixDaysAgo = new Date(today);
        sixDaysAgo.setDate(today.getDate() - 6);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const todayKey = toDateKey(today);
        const yesterdayKey = toDateKey(yesterday);
        const weekStartKey = toDateKey(sixDaysAgo);
        const monthStartKey = toDateKey(monthStart);
        const monthEndKey = toDateKey(monthEnd);

        const [
          schoolResult,
          studentsResult,
          teachersResult,
          classesResult,
          weekAttendanceResult,
          monthAttendanceResult,
          feesResult,
          recentStudentsResult,
          admissionsResult,
          examsResult,
          eventsResult,
        ] = await Promise.all([
          supabase.from('schools').select('name, slug').eq('id', schoolId).single(),
          supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
          supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
          supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
          supabase
            .from('attendance')
            .select('student_id, attendance_date, status')
            .eq('school_id', schoolId)
            .gte('attendance_date', weekStartKey)
            .lte('attendance_date', todayKey),
          supabase
            .from('attendance')
            .select('student_id, attendance_date, status')
            .eq('school_id', schoolId)
            .gte('attendance_date', monthStartKey)
            .lte('attendance_date', todayKey),
          supabase
            .from('fee_records')
            .select('student_id, amount, payment_date')
            .eq('school_id', schoolId)
            .gte('payment_date', monthStartKey)
            .lte('payment_date', monthEndKey),
          supabase
            .from('students')
            .select('id, name, class, section, created_at')
            .eq('school_id', schoolId)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('admission_applications')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .eq('status', 'pending'),
          supabase
            .from('exams')
            .select('id, name, start_date')
            .eq('school_id', schoolId)
            .gte('start_date', todayKey)
            .order('start_date', { ascending: true })
            .limit(5),
          supabase
            .from('news_events')
            .select('id, title, event_date, event_time')
            .eq('school_id', schoolId)
            .eq('is_event', true)
            .gte('event_date', todayKey)
            .order('event_date', { ascending: true })
            .limit(5),
        ]);

        const firstError = [
          schoolResult.error,
          studentsResult.error,
          teachersResult.error,
          classesResult.error,
          weekAttendanceResult.error,
          monthAttendanceResult.error,
          feesResult.error,
          recentStudentsResult.error,
          admissionsResult.error,
          examsResult.error,
          eventsResult.error,
        ].find(Boolean);

        if (firstError) throw firstError;

        const weekAttendance = (weekAttendanceResult.data || []) as AttendanceRecord[];
        const monthAttendance = (monthAttendanceResult.data || []) as AttendanceRecord[];
        const fees = (feesResult.data || []) as FeeRecord[];
        const exams = (examsResult.data || []) as ExamRecord[];
        const events = (eventsResult.data || []) as EventRecord[];

        const attendanceTrend = Array.from({ length: 7 }, (_, index) => {
          const date = new Date(sixDaysAgo);
          date.setDate(sixDaysAgo.getDate() + index);
          const dateKey = toDateKey(date);
          return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            date: dateKey,
            attendance: attendanceRate(
              weekAttendance.filter((record) => record.attendance_date === dateKey)
            ),
          };
        });

        const studentAttendance = new Map<string, { present: number; total: number }>();
        monthAttendance.forEach((record) => {
          if (!record.student_id || record.status === 'unmarked') return;
          const current = studentAttendance.get(record.student_id) || { present: 0, total: 0 };
          current.total += 1;
          if (record.status === 'present' || record.status === 'late') current.present += 1;
          studentAttendance.set(record.student_id, current);
        });

        let lowAttendance = 0;
        studentAttendance.forEach(({ present, total }) => {
          if (total > 0 && (present / total) * 100 < 75) lowAttendance += 1;
        });

        const schedule: ScheduleItem[] = [
          ...exams
            .filter((exam): exam is ExamRecord & { start_date: string } => Boolean(exam.start_date))
            .map((exam) => ({
              id: `exam-${exam.id}`,
              title: exam.name,
              date: exam.start_date,
              time: null,
              type: 'Exam' as const,
            })),
          ...events
            .filter((event): event is EventRecord & { event_date: string } => Boolean(event.event_date))
            .map((event) => ({
              id: `event-${event.id}`,
              title: event.title,
              date: event.event_date,
              time: event.event_time,
              type: 'Event' as const,
            })),
        ]
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 5);

        const todayRecords = weekAttendance.filter(
          (record) => record.attendance_date === todayKey
        );
        const yesterdayRecords = weekAttendance.filter(
          (record) => record.attendance_date === yesterdayKey
        );

        if (!cancelled) {
          setDashboard({
            profile,
            school: schoolResult.data as SchoolRecord,
            students: studentsResult.count || 0,
            teachers: teachersResult.count || 0,
            classes: classesResult.count || 0,
            todayAttendance: attendanceRate(todayRecords),
            yesterdayAttendance: attendanceRate(yesterdayRecords),
            feesCollected: fees.reduce(
              (total, record) => total + Number(record.amount || 0),
              0
            ),
            paidStudents: new Set(
              fees.map((record) => record.student_id).filter(Boolean)
            ).size,
            pendingAdmissions: admissionsResult.count || 0,
            lowAttendance,
            upcomingExams: exams.length,
            attendanceTrend,
            recentStudents: (recentStudentsResult.data || []) as StudentRecord[],
            schedule,
          });
        }
      } catch (loadError) {
        console.error('Principal dashboard error:', loadError);
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'The dashboard could not be loaded.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-950">Please sign in</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in with your principal account to open this dashboard.
          </p>
          <Link href="/auth/login?role=principal" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  const attendanceDifference =
    dashboard.todayAttendance - dashboard.yesterdayAttendance;
  const feeProgress =
    dashboard.students > 0
      ? Math.min(100, Math.round((dashboard.paidStudents / dashboard.students) * 100))
      : 0;
  const unpaidStudents = Math.max(0, dashboard.students - dashboard.paidStudents);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const firstName = dashboard.profile?.full_name?.split(' ')[0] || 'Principal';

  const attentionCandidates: Array<AttentionData | null> = [
    dashboard.pendingAdmissions > 0
      ? {
          icon: UserPlus,
          title: `${dashboard.pendingAdmissions} pending admission${dashboard.pendingAdmissions === 1 ? '' : 's'}`,
          description: 'Applications are waiting for your review.',
          href: '/principal/admission',
          action: 'Review',
          tone: 'amber',
        }
      : null,
    unpaidStudents > 0
      ? {
          icon: Wallet,
          title: `${unpaidStudents} student${unpaidStudents === 1 ? '' : 's'} without a payment record`,
          description: 'Check this month’s fee collection and follow up.',
          href: '/principal/fees',
          action: 'View fees',
          tone: 'red',
        }
      : null,
    dashboard.lowAttendance > 0
      ? {
          icon: ClipboardCheck,
          title: `${dashboard.lowAttendance} low-attendance student${dashboard.lowAttendance === 1 ? '' : 's'}`,
          description: 'Attendance is below 75% for this month.',
          href: '/principal/attendance',
          action: 'Check',
          tone: 'orange',
        }
      : null,
    dashboard.upcomingExams > 0
      ? {
          icon: FileText,
          title: `${dashboard.upcomingExams} upcoming exam${dashboard.upcomingExams === 1 ? '' : 's'}`,
          description: 'Review the schedule and prepare results.',
          href: '/principal/results',
          action: 'Open exams',
          tone: 'blue',
        }
      : null,
  ];
  const attentionItems = attentionCandidates.filter(
    (item): item is AttentionData => item !== null
  );

  const statCards = [
    {
      label: 'Students',
      value: dashboard.students.toLocaleString(),
      helper: `${dashboard.classes} active class${dashboard.classes === 1 ? '' : 'es'}`,
      icon: Users,
      iconClass: 'bg-blue-50 text-blue-600',
      href: '/principal/students',
    },
    {
      label: 'Teachers',
      value: dashboard.teachers.toLocaleString(),
      helper: 'School staff accounts',
      icon: GraduationCap,
      iconClass: 'bg-violet-50 text-violet-600',
      href: '/principal/teachers',
    },
    {
      label: 'Today’s attendance',
      value: `${dashboard.todayAttendance}%`,
      helper:
        dashboard.yesterdayAttendance > 0
          ? `${attendanceDifference >= 0 ? '+' : ''}${attendanceDifference}% from yesterday`
          : 'No previous-day comparison',
      icon: ClipboardCheck,
      iconClass: 'bg-emerald-50 text-emerald-600',
      href: '/principal/attendance',
      trend: dashboard.yesterdayAttendance > 0 ? attendanceDifference : null,
    },
    {
      label: 'Fees this month',
      value: `NPR ${dashboard.feesCollected.toLocaleString()}`,
      helper: `${dashboard.paidStudents} of ${dashboard.students} students recorded`,
      icon: Wallet,
      iconClass: 'bg-amber-50 text-amber-600',
      href: '/principal/fees',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{dateLabel}</p>
                <h1 className="mt-1 text-2xl font-bold tracking-[-0.025em] text-slate-950 sm:text-3xl">
                  {greeting}, <span className="text-blue-600">{firstName}</span>
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Here is what needs attention at{' '}
                  <span className="font-semibold text-slate-700">
                    {dashboard.school?.name || 'your school'}
                  </span>
                  .
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <QuickAction href="/principal/students" icon={UserPlus} label="Add student" />
                <QuickAction href="/principal/fees" icon={ReceiptText} label="Record fee" />
                <QuickAction href="/principal/communication" icon={Megaphone} label="Publish notice" />
                {dashboard.school?.slug && (
                  <Link
                    href={`/s/${dashboard.school.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">School website</span>
                  </Link>
                )}
              </div>
            </header>

            {error && (
              <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <section aria-label="School overview" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((stat) => (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <p className="mt-3 text-2xl font-bold tracking-[-0.025em] text-slate-950 tabular-nums sm:text-3xl">
                        {stat.value}
                      </p>
                    </div>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}>
                      <stat.icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                  </div>
                  <p className={`mt-3 flex items-center gap-1.5 text-xs ${
                    stat.trend === undefined || stat.trend === null
                      ? 'text-slate-400'
                      : stat.trend >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                  }`}>
                    {stat.trend !== undefined && stat.trend !== null &&
                      (stat.trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />)}
                    {stat.helper}
                  </p>
                </Link>
              ))}
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Needs your attention</h2>
                  <p className="mt-1 text-sm text-slate-500">Important school work, ordered in one place.</p>
                </div>
                {attentionItems.length > 0 && (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                    {attentionItems.length} active
                  </span>
                )}
              </div>

              {attentionItems.length === 0 ? (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Everything looks good</p>
                    <p className="mt-0.5 text-xs text-emerald-700">There are no urgent items requiring your attention.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {attentionItems.map((item) => (
                    <AttentionItem key={item.title} {...item} />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Attendance trend</h2>
                    <p className="mt-1 text-sm text-slate-500">The last seven days of recorded attendance.</p>
                  </div>
                  <Link href="/principal/attendance" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                    View details
                  </Link>
                </div>
                <div className="mt-5 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard.attendanceTrend} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, 'Attendance']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px -15px rgba(15,23,42,.35)' }}
                      />
                      <Area type="monotone" dataKey="attendance" stroke="#2563eb" strokeWidth={2.5} fill="url(#attendanceFill)" dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Fee collection</h2>
                    <p className="mt-1 text-sm text-slate-500">Current month</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Wallet className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-8 text-3xl font-bold tracking-[-0.03em] text-slate-950 tabular-nums">
                  NPR {dashboard.feesCollected.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-slate-500">Total recorded payments</p>

                <div className="mt-8">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">Students recorded</span>
                    <span className="font-bold text-slate-900">{feeProgress}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all" style={{ width: `${feeProgress}%` }} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-emerald-50 p-3">
                      <p className="text-xs text-emerald-700">Paid records</p>
                      <p className="mt-1 text-xl font-bold text-emerald-900">{dashboard.paidStudents}</p>
                    </div>
                    <div className="rounded-xl bg-red-50 p-3">
                      <p className="text-xs text-red-700">Not recorded</p>
                      <p className="mt-1 text-xl font-bold text-red-900">{unpaidStudents}</p>
                    </div>
                  </div>
                </div>
                <Link href="/principal/fees" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800">
                  Open fee management <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Recently added students</h2>
                    <p className="mt-1 text-sm text-slate-500">The newest student records at your school.</p>
                  </div>
                  <Link href="/principal/students" className="text-xs font-semibold text-blue-600 hover:text-blue-800">View all</Link>
                </div>
                {dashboard.recentStudents.length === 0 ? (
                  <EmptyState icon={Users} title="No students added yet" text="Add your first student to begin building the school directory." href="/principal/students" action="Add student" />
                ) : (
                  <div className="divide-y divide-slate-100 px-5 sm:px-6">
                    {dashboard.recentStudents.map((student) => (
                      <div key={student.id} className="flex items-center gap-3 py-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                          {initials(student.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{student.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {student.class ? `Class ${student.class}` : 'Class not assigned'}
                            {student.section ? ` · Section ${student.section}` : ''}
                          </p>
                        </div>
                        <span className="hidden text-xs text-slate-400 sm:block">
                          {student.created_at
                            ? new Date(student.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                            : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Coming up</h2>
                    <p className="mt-1 text-sm text-slate-500">Upcoming exams and events.</p>
                  </div>
                  <CalendarDays className="h-5 w-5 text-slate-400" />
                </div>
                {dashboard.schedule.length === 0 ? (
                  <EmptyState icon={CalendarDays} title="Nothing scheduled" text="New exams and calendar events will appear here." href="/principal/calendar" action="Open calendar" />
                ) : (
                  <div className="divide-y divide-slate-100 px-5 sm:px-6">
                    {dashboard.schedule.map((item) => {
                      const itemDate = new Date(`${item.date}T00:00:00`);
                      return (
                        <div key={item.id} className="flex gap-3 py-4">
                          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-500">{itemDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                            <span className="text-lg font-bold leading-none text-slate-900">{itemDate.getDate()}</span>
                          </div>
                          <div className="min-w-0">
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${item.type === 'Exam' ? 'text-amber-600' : 'text-blue-600'}`}>{item.type}</span>
                            <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                            {item.time && <p className="mt-0.5 text-xs text-slate-400">{item.time}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: ElementType; label: string }) {
  return (
    <Link href={href} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
      <Plus className="h-3.5 w-3.5 sm:hidden" />
    </Link>
  );
}

const attentionTones = {
  amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
  red: 'border-red-100 bg-red-50/70 text-red-700',
  orange: 'border-orange-100 bg-orange-50/70 text-orange-700',
  blue: 'border-blue-100 bg-blue-50/70 text-blue-700',
};

function AttentionItem({ icon: Icon, title, description, href, action, tone }: AttentionData) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3.5 ${attentionTones[tone]}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{description}</p>
      </div>
      <Link href={href} className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-black/5 transition hover:text-blue-700">
        {action}
      </Link>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text, href, action }: {
  icon: ElementType;
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <div className="px-6 py-10 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">{text}</p>
      <Link href={href} className="mt-4 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-800">{action}</Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pt-10 lg:ml-64">
        <TopBar />
        <main className="px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px] animate-pulse">
            <div className="h-8 w-72 rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 rounded-2xl bg-white ring-1 ring-slate-200" />)}
            </div>
            <div className="mt-6 h-52 rounded-2xl bg-white ring-1 ring-slate-200" />
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="h-80 rounded-2xl bg-white ring-1 ring-slate-200" />
              <div className="h-80 rounded-2xl bg-white ring-1 ring-slate-200" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
