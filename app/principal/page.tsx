'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
// @ts-ignore
import NepaliDate from 'nepali-date-converter';
import { 
  Users, 
  GraduationCap, 
  ClipboardCheck, 
  Wallet, 
  FileText, 
  UserPlus, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  MoreHorizontal, 
  Cake, 
  Bell, 
  Megaphone, 
  Send, 
  UserX, 
  CheckCircle, 
  AlertCircle, 
  CloudSun, 
  CalendarDays,
  Globe
} from 'lucide-react';

// Recharts Components
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';

// --- Mock Data for Charts (We will connect real data later) ---
const attendanceData = [
  { name: 'Mon', attendance: 92 },
  { name: 'Tue', attendance: 94 },
  { name: 'Wed', attendance: 93 },
  { name: 'Thu', attendance: 95 },
  { name: 'Fri', attendance: 94 },
  { name: 'Sat', attendance: 91 },
];

const feeData = [
  { name: 'Collected', value: 840000, color: '#10b981' }, // Emerald 500
  { name: 'Pending', value: 260000, color: '#f59e0b' },   // Amber 500
  { name: 'Overdue', value: 120000, color: '#ef4444' },   // Red 500
];

const healthMetrics = [
  { label: 'Attendance', value: 94, color: 'bg-emerald-500' },
  { label: 'Fee Collection', value: 82, color: 'bg-amber-500' },
  { label: 'Academic Performance', value: 89, color: 'bg-emerald-500' },
  { label: 'Teacher Attendance', value: 96, color: 'bg-emerald-500' },
  { label: 'Pending Tasks', value: 91, color: 'bg-emerald-500' },
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, exams: 0 });
  const [todayRate, setTodayRate] = useState(0);
  const [yesterdayRate, setYesterdayRate] = useState(0);
  const [feeMonth, setFeeMonth] = useState({ collected: 0, paidStudents: 0 });
  const [upcomingExams, setUpcomingExams] = useState(0);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [newStudentsThisMonth, setNewStudentsThisMonth] = useState(0);
  const [pendingAdmissions, setPendingAdmissions] = useState(0);
  const [birthdaysToday, setBirthdaysToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [birthdaysThisWeek, setBirthdaysThisWeek] = useState(0);
  const [activeNotices, setActiveNotices] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [lowAttendanceCount, setLowAttendanceCount] = useState(0);
  const [unreadNotices, setUnreadNotices] = useState(0);

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) { setLoading(false); return; }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      setProfile(profileData);

      if (profileData?.school_id) {
        const schoolId = profileData.school_id;
        const { data: schoolData } = await supabase.from('schools').select('*').eq('id', schoolId).single();
        setSchool(schoolData);

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const monthKey = todayStr.slice(0, 7);

          const [studentsRes, teachersRes, classesRes, examsRes, attendanceTodayRes, attendanceYesterdayRes, feesRes, recentRes, newStudentsRes, admissionsRes, birthdaysRes, noticesRes, eventsRes, attendanceMonthRes] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
          supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
          supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
          supabase.from('exams').select('id, exam_date').eq('school_id', schoolId),
          supabase.from('attendance').select('status').eq('school_id', schoolId).eq('attendance_date', todayStr),
          supabase.from('attendance').select('status').eq('school_id', schoolId).eq('attendance_date', yesterdayStr),
          supabase.from('fee_records').select('amount, student_id, payment_date').eq('school_id', schoolId),
          supabase.from('students').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(4),
          supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).gte('created_at', monthKey + '-01'),
          supabase.from('admission_applications').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'pending'),
          supabase.from('students').select('dob').eq('school_id', schoolId),
          supabase.from('notices').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).gte('publish_date', todayStr),
          supabase.from('news_events').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_event', true).gte('event_date', todayStr),
          supabase.from('attendance').select('student_id, status').eq('school_id', schoolId).gte('attendance_date', monthKey + '-01'),
        ]);

        const attToday = attendanceTodayRes.data || [];
        const presentToday = attToday.filter((a: any) => a.status === 'present').length;
        const absentToday = attToday.filter((a: any) => a.status === 'absent').length;
        setTodayRate(presentToday + absentToday > 0 ? Math.round((presentToday / (presentToday + absentToday)) * 100) : 0);

        const attYesterday = attendanceYesterdayRes.data || [];
        const presentYesterday = attYesterday.filter((a: any) => a.status === 'present').length;
        const absentYesterday = attYesterday.filter((a: any) => a.status === 'absent').length;
        setYesterdayRate(presentYesterday + absentYesterday > 0 ? Math.round((presentYesterday / (presentYesterday + absentYesterday)) * 100) : 0);

        const monthFees = (feesRes.data || []).filter((r: any) => (r.payment_date || '').startsWith(monthKey));
        setFeeMonth({
          collected: monthFees.reduce((s: number, r: any) => s + (r.amount || 0), 0),
          paidStudents: new Set(monthFees.map((r: any) => r.student_id)).size,
        });

        setUpcomingExams((examsRes.data || []).filter((e: any) => e.exam_date >= todayStr).length);
        setStats({ students: studentsRes.count || 0, teachers: teachersRes.count || 0, classes: classesRes.count || 0, exams: examsRes.count || 0 });
        setRecentStudents(recentRes.data || []);
        setNewStudentsThisMonth(newStudentsRes.count || 0);
        setPendingAdmissions(admissionsRes.count || 0);

        const todayMonth = today.getMonth() + 1; const todayDay = today.getDate();
        setBirthdaysToday((birthdaysRes.data || []).filter((s: any) => { if (!s.dob) return false; const d = new Date(s.dob); return d.getMonth() + 1 === todayMonth && d.getDate() === todayDay; }).length);
                // --- NEW: Upcoming This Week & Needs Action Data ---
        
        // 1. Birthdays this week (reuses the birthdaysRes data we already fetched)
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const bdaysThisWeek = (birthdaysRes.data || []).filter((s: any) => {
          if (!s.dob) return false;
          const d = new Date(s.dob);
          const thisYear = today.getFullYear();
          const bdayThisYear = new Date(thisYear, d.getMonth(), d.getDate());
          return bdayThisYear >= today && bdayThisYear <= weekFromNow;
        });
        setBirthdaysThisWeek(bdaysThisWeek.length);

        // 2. Active Notices
        setActiveNotices(noticesRes.count || 0);

        // 3. Upcoming Events this month
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        const { count: eventsCount } = await supabase
          .from('news_events')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('is_event', true)
          .gte('event_date', todayStr)
          .lte('event_date', monthEnd);
        setUpcomingEvents(eventsCount || 0);

        // 4. Low Attendance Students (< 75% this month)
        const studentAttendanceMap = new Map();
        (attendanceMonthRes.data || []).forEach((a: any) => {
          if (!studentAttendanceMap.has(a.student_id)) {
            studentAttendanceMap.set(a.student_id, { present: 0, total: 0 });
          }
          const stats = studentAttendanceMap.get(a.student_id);
          stats.total++;
          if (a.status === 'present') stats.present++;
        });
        let lowAttCount = 0;
        studentAttendanceMap.forEach((stats: any) => {
          const rate = (stats.present / stats.total) * 100;
          if (rate < 75) lowAttCount++;
        });
        setLowAttendanceCount(lowAttCount);

        // 5. Unread Notices (Placeholder for now)
        setUnreadNotices(0); 
      }
      setLoading(false);
    }
    getData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  if (!user) return <div className="flex h-screen items-center justify-center">Please log in</div>;

  const feePercent = stats.students > 0 ? Math.min(100, Math.round((feeMonth.paidStudents / stats.students) * 100)) : 0;
  const duesCount = Math.max(0, stats.students - feeMonth.paidStudents);
  const health = stats.students > 0 ? Math.round((todayRate + feePercent) / 2) : 0;
  const attendanceTrend = todayRate - yesterdayRate;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  let npDate = '';
  try { npDate = new NepaliDate(new Date()).format('DD MMMM YYYY'); } catch { npDate = ''; }

  const attention: { icon: string; text: string; href: string; link: string }[] = [];
  if (pendingAdmissions > 0) attention.push({ icon: '🔴', text: `${pendingAdmissions} admission application${pendingAdmissions === 1 ? '' : 's'} waiting for review`, href: '/principal/admissions', link: 'Review →' });
  if (duesCount > 0) attention.push({ icon: '🟠', text: `${duesCount} student${duesCount === 1 ? '' : 's'} haven't paid fees this month`, href: '/principal/fees/dues', link: 'See dues →' });
  if (todayRate > 0 && todayRate < 80) attention.push({ icon: '🟡', text: `Today's attendance is low (${todayRate}%)`, href: '/principal/attendance/history', link: 'View →' });
  if (upcomingExams > 0) attention.push({ icon: '📝', text: `${upcomingExams} exam${upcomingExams === 1 ? '' : 's'} coming up`, href: '/principal/exams', link: 'View →' });
  if (birthdaysToday > 0) attention.push({ icon: '🎂', text: `${birthdaysToday} student${birthdaysToday === 1 ? '' : 's'} have birthday today!`, href: '/principal/birthdays', link: 'Wish them →' });

  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
                 {/* ✅ 1. Upgraded Header */}
       <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div>
           <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
             {greeting}, <span className="text-blue-600">{profile?.full_name?.split(' ')[0] || 'Principal'}</span> 👋
           </h1>
           <p className="mt-1.5 text-sm text-gray-500">
             Here's what's happening at <span className="font-medium text-gray-700">{school?.name || 'your school'}</span> today.
           </p>
           <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
             <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 font-medium text-red-700 ring-1 ring-red-100">{npDate} B.S.</span>
             <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 ring-1 ring-gray-200">
               <Calendar className="h-3.5 w-3.5 text-gray-500" /> {dateStr}
             </span>
           </div>
         </div>
         
         {/* ✅ View Website Button (Right Side) */}
         {school?.slug && (
           <Link 
             href={`/s/${school.slug}`} 
             target="_blank" 
             rel="noopener noreferrer"
             className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all hover:-translate-y-0.5"
           >
             <Globe className="h-4 w-4" />
             View Your Website
           </Link>
         )}
       </div>

          {/* ✅ 2. Premium Stats Grid */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">Students</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100"><Users className="h-5 w-5" /></div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900 tabular-nums">{stats.students}</p>
              {newStudentsThisMonth > 0 && <div className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700"><TrendingUp className="h-3 w-3" /> +{newStudentsThisMonth} this month</div>}
            </div>
            <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">Teachers</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100"><GraduationCap className="h-5 w-5" /></div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900 tabular-nums">{stats.teachers}</p>
            </div>
            <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">Attendance</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100"><ClipboardCheck className="h-5 w-5" /></div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900 tabular-nums">{todayRate}%</p>
              {yesterdayRate > 0 && <div className={`mt-3 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${attendanceTrend >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{attendanceTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {attendanceTrend >= 0 ? '+' : ''}{attendanceTrend}% vs yesterday</div>}
            </div>
            <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">Fees Collected</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100"><Wallet className="h-5 w-5" /></div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900 tabular-nums">NPR {feeMonth.collected.toLocaleString()}</p>
              <p className="mt-3 text-xs text-gray-400">{feeMonth.paidStudents} of {stats.students} students paid</p>
            </div>
            <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">Upcoming Exams</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100"><FileText className="h-5 w-5" /></div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900 tabular-nums">{upcomingExams}</p>
            </div>
            <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">Pending Admissions</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100"><UserPlus className="h-5 w-5" /></div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900 tabular-nums">{pendingAdmissions}</p>
            </div>
          </div>

          {/* ✅ 3. NEW: Analytics Charts Section */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            
            {/* Attendance Overview (Line/Area Chart) */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Attendance Overview</h3>
                <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-xs font-medium text-gray-500">
                  <button className="rounded-md bg-white px-3 py-1.5 text-gray-900 shadow-sm">This week</button>
                  <button className="rounded-md px-3 py-1.5 hover:bg-gray-50">This month</button>
                  <button className="rounded-md px-3 py-1.5 hover:bg-gray-50">This term</button>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fee Collection (Donut Chart) */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Fee Collection</h3>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div><p className="text-xs text-gray-500">Expected</p><p className="text-lg font-bold text-gray-900">NPR 12,00,000</p></div>
                <div><p className="text-xs text-gray-500">Collected</p><p className="text-lg font-bold text-emerald-600">NPR 8,40,000</p></div>
                <div><p className="text-xs text-gray-500">Pending</p><p className="text-lg font-bold text-amber-600">NPR 2,60,000</p></div>
                <div><p className="text-xs text-gray-500">Overdue</p><p className="text-lg font-bold text-red-600">NPR 1,20,000</p></div>
              </div>
              <div className="h-48 w-full flex justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={feeData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {feeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend below chart */}
                <div className="absolute bottom-0 flex gap-4 text-xs font-medium text-gray-600">
                  <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-emerald-500"></div>Collected</div>
                  <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-amber-500"></div>Pending</div>
                  <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-red-500"></div>Overdue</div>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-xs font-medium text-gray-500 mb-1.5">
                  <span>Collection Progress</span>
                  <span>70%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ 4. School Health Score (Gauge & Metrics) */}
          <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              
              {/* Left: Big Circle Score */}
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="relative h-32 w-32 flex-shrink-0">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-emerald-500" strokeDasharray={`${health}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{health}%</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">School Health Score: {health}%</h3>
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> School is doing well
                  </p>
                  <p className="mt-2 text-sm text-gray-400 max-w-xs">Fee collection is currently 8% below the monthly target.</p>
                  <button className="mt-3 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">View detailed analysis</button>
                </div>
              </div>

              {/* Right: Progress Bars */}
              <div className="flex-1 w-full space-y-4">
                {healthMetrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5">
                      <span>{metric.label}</span>
                      <span>{metric.value}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div className={`h-full rounded-full ${metric.color} transition-all duration-500`} style={{ width: `${metric.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
          
        {/* ✅ Upcoming This Week + Needs Action Section */}
<div className="mb-8 space-y-6">
  
  {/* Row 1: Upcoming This Week (4 Cards) */}
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    
    {/*  Upcoming Exams */}
    <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Upcoming Exams</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{upcomingExams}</p>
          <p className="mt-1 text-xs text-gray-500">This week</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
          <FileText className="h-5 w-5" />
        </div>
      </div>
      <Link href="/exams" className="mt-4 inline-flex items-center text-sm font-semibold text-orange-600 hover:text-orange-700">
        View Schedule →
      </Link>
    </div>

    {/* 🎂 Birthdays This Week */}
    <div className="rounded-xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-pink-600">Birthdays</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{birthdaysThisWeek}</p>
          <p className="mt-1 text-xs text-gray-500">This week</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
          <Cake className="h-5 w-5" />
        </div>
      </div>
      <Link href="/principal/birthdays" className="mt-4 inline-flex items-center text-sm font-semibold text-pink-600 hover:text-pink-700">
        See Who →
      </Link>
    </div>

    {/*  Active Notices */}
    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Active Notices</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{activeNotices}</p>
          <p className="mt-1 text-xs text-gray-500">Published</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Bell className="h-5 w-5" />
        </div>
      </div>
      <Link href="/notices" className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700">
        Manage →
      </Link>
    </div>

    {/* 🏫 School Events */}
    <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Events</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{upcomingEvents}</p>
          <p className="mt-1 text-xs text-gray-500">This month</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
          <Calendar className="h-5 w-5" />
        </div>
      </div>
      <Link href="/principal/website" className="mt-4 inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-700">
        View All →
      </Link>
    </div>
  </div>

  {/* Row 2: Needs Action (4 Stat Boxes + Action Buttons) */}
  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
    <h3 className="mb-4 text-lg font-bold text-gray-900">⚡ Needs Your Action</h3>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      
      {/* Pending Admissions */}
      <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 p-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Pending Admissions</p>
          <p className="mt-1 text-3xl font-bold text-amber-900">{pendingAdmissions}</p>
        </div>
        <Link 
          href="/principal/admissions" 
          className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          Review
        </Link>
      </div>

      {/* Fee Defaulters */}
      <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4">
        <div>
          <p className="text-sm font-medium text-red-700">Fee Defaulters</p>
          <p className="mt-1 text-3xl font-bold text-red-900">{duesCount}</p>
        </div>
        <Link 
          href="/fees/dues" 
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Remind
        </Link>
      </div>

      {/* Low Attendance Students */}
      <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 p-4">
        <div>
          <p className="text-sm font-medium text-orange-700">Low Attendance</p>
          <p className="mt-1 text-3xl font-bold text-orange-900">{lowAttendanceCount}</p>
        </div>
        <Link 
          href="/attendance/history" 
          className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors"
        >
          Check
        </Link>
      </div>

      {/* Unread Messages/Notices */}
      <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 p-4">
        <div>
          <p className="text-sm font-medium text-indigo-700">Unread Notices</p>
          <p className="mt-1 text-3xl font-bold text-indigo-900">{unreadNotices}</p>
        </div>
        <Link 
          href="/notices" 
          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Publish
        </Link>
      </div>

    </div>
  </div>
            {/* ✅ NEW: Daily Operations & Productivity Widgets (2x2 Grid) */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            
            {/* 1. Quick Broadcast Publisher */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-blue-600" /> Quick Broadcast
                </h3>
                <span className="text-xs font-medium text-gray-400">Send to Parents/Teachers</span>
              </div>
              <textarea
                placeholder="e.g., School will remain closed tomorrow due to heavy rainfall..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                rows={3}
              />
              <div className="mt-3 flex items-center justify-between">
                <select className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option>All Parents</option>
                  <option>All Teachers</option>
                  <option>Both</option>
                </select>
                <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                  <Send className="h-4 w-4" /> Broadcast Now
                </button>
              </div>
            </div>

            {/* 2. Staff on Leave Today */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <UserX className="h-5 w-5 text-red-500" /> Staff on Leave Today
                </h3>
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">3 Absent</span>
              </div>
              <div className="space-y-3">
                {/* Mock Data - Replace with real DB query later */}
                <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">RK</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Ram K. Shrestha</p>
                      <p className="text-xs text-gray-500">Sick Leave • Class 10 Math</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
                    <CheckCircle className="h-3 w-3" /> Sub Assigned
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-600">SP</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Sita Poudel</p>
                      <p className="text-xs text-gray-500">Personal • Class 8 Science</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                    <AlertCircle className="h-3 w-3" /> Needs Sub
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">HT</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Hari Thapa</p>
                      <p className="text-xs text-gray-500">Sick Leave • Class 9 English</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
                    <CheckCircle className="h-3 w-3" /> Sub Assigned
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Daily Cash Flow / Petty Cash */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" /> Daily Cash Flow
                </h3>
                <span className="text-xs font-medium text-gray-400">Today, {dateStr.split(',')[0]}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                  <p className="text-xs font-medium text-emerald-700">Today's Income</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900 tabular-nums">NPR 12,500</p>
                  <p className="mt-1 text-[10px] text-emerald-600 flex items-center gap-1"><TrendingUp className="h-3 w-3"/> +12% vs yesterday</p>
                </div>
                <div className="rounded-xl bg-red-50 p-4 border border-red-100">
                  <p className="text-xs font-medium text-red-700">Today's Expenses</p>
                  <p className="mt-1 text-2xl font-bold text-red-900 tabular-nums">NPR 2,400</p>
                  <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1"><TrendingDown className="h-3 w-3"/> Petty cash & supplies</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
                <span className="text-sm font-medium text-gray-600">Net Cash Flow Today</span>
                <span className="text-sm font-bold text-gray-900 tabular-nums">+ NPR 10,100</span>
              </div>
            </div>

            {/* 4. Local Weather & Next Holiday */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CloudSun className="h-5 w-5 text-sky-500" /> Local Context
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Weather Widget (Mock Data - Connect OpenWeather API later) */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 p-4 border border-sky-100 text-center">
                  <CloudSun className="h-10 w-10 text-sky-500 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">22°C</p>
                  <p className="text-xs font-medium text-gray-600">Light Rain</p>
                  <p className="mt-1 text-[10px] text-gray-400">{school?.municipality || 'Syangja'}</p>
                </div>
                {/* Next Holiday Widget */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 p-4 border border-purple-100 text-center">
                  <CalendarDays className="h-10 w-10 text-purple-500 mb-2" />
                  <p className="text-lg font-bold text-gray-900 leading-tight">Constitution Day</p>
                  <p className="text-xs font-medium text-gray-600 mt-1">Nov 9, 2024</p>
                  <p className="mt-1 text-[10px] text-purple-600 font-semibold">In 14 Days</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 px-4 py-2.5 flex items-start gap-2">
                <span className="text-amber-500 text-sm">💡</span>
                <p className="text-xs text-amber-800 font-medium">Monsoon season may affect attendance. Ensure roof drainage is checked.</p>
              </div>
            </div>

          </div>

</div>

        </main>
      </div>
    </div>
  );
}