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
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  MessageSquare,
  BarChart3,
  ChevronRight
} from 'lucide-react';

// Recharts Components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function TeacherDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    attendancePending: 0,
    marksPending: 0,
    activeAssignments: 0
  });

  // Today's data
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [classPerformance, setClassPerformance] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) { setLoading(false); return; }
      if (user.app_metadata?.must_change_password === true) {
        window.location.replace('/auth/change-password');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);

      if (profileData?.school_id) {
        const schoolId = profileData.school_id;
        const { data: schoolData } = await supabase
          .from('schools')
          .select('*')
          .eq('id', schoolId)
          .single();
        setSchool(schoolData);

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Fetch teacher's classes
        const { data: classesData } = await supabase
          .from('classes')
          .select(`
            id,
            class_name,
            section_name,
            students (
              id,
              name,
              attendance (
                status,
                attendance_date
              )
            )
          `)
          .eq('school_id', schoolId);

        // Fetch today's attendance status
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('class_id, status')
          .eq('school_id', schoolId)
          .eq('attendance_date', todayStr);

        // Fetch pending marks (mock - you'll need a marks table)
        const { data: marksData } = await supabase
          .from('exams')
          .select('*')
          .eq('school_id', schoolId)
          .gte('exam_date', todayStr);

        // Calculate stats
        const totalClasses = classesData?.length || 0;
        const totalStudents = classesData?.reduce((acc, cls: any) => acc + (cls.students?.length || 0), 0) || 0;
        
        // Count pending attendance
        const pendingAttendance = classesData?.filter((cls: any) => {
          const classAttendance = attendanceData?.find((a: any) => a.class_id === cls.id);
          return !classAttendance;
        }).length || 0;

        setStats({
          totalClasses,
          totalStudents,
          attendancePending: pendingAttendance,
          marksPending: marksData?.length || 0,
          activeAssignments: 3 // Mock for now
        });

        // Build today's classes schedule (mock data - replace with timetable table)
        const mockTodayClasses = [
          { id: 1, period: 'Period 1', time: '8:00 – 8:45', class: 'Grade 10A', subject: 'Mathematics', status: 'Mark Attendance', color: 'amber' },
          { id: 2, period: 'Period 3', time: '9:30 – 10:15', class: 'Grade 9A', subject: 'Mathematics', status: 'Completed', color: 'green' },
          { id: 3, period: 'Period 5', time: '11:15 – 12:00', class: 'Grade 10B', subject: 'Mathematics', status: 'Upcoming', color: 'blue' },
          { id: 4, period: 'Period 7', time: '13:30 – 14:15', class: 'Grade 9B', subject: 'Mathematics', status: 'Upcoming', color: 'blue' },
        ];
        setTodayClasses(mockTodayClasses);

        // Build class performance data (mock - replace with real marks calculation)
        const performanceData = [
          { name: '10A', avgScore: 76, students: 42, attendance: 94 },
          { name: '10B', avgScore: 71, students: 40, attendance: 91 },
          { name: '9A', avgScore: 78, students: 45, attendance: 95 },
          { name: '9B', avgScore: 74, students: 43, attendance: 92 },
        ];
        setClassPerformance(performanceData);

        // Build action items
        const actions = [];
        if (pendingAttendance > 0) {
          actions.push({
            icon: ClipboardCheck,
            text: `Attendance not marked for ${pendingAttendance} class${pendingAttendance > 1 ? 'es' : ''}`,
            action: 'Mark now',
            href: '/teacher/attendance',
            color: 'amber'
          });
        }
        if (marksData && marksData.length > 0) {
          actions.push({
            icon: FileText,
            text: `${marksData.length} exam marks pending entry`,
            action: 'Enter marks',
            href: '/teacher/marks',
            color: 'blue'
          });
        }
        actions.push({
          icon: AlertCircle,
          text: '3 students in your classes below 75% attendance',
          action: 'View students',
          href: '/teacher/students',
          color: 'red'
        });
        actions.push({
          icon: MessageSquare,
          text: '2 parent messages awaiting reply',
          action: 'Open inbox',
          href: '/teacher/communication',
          color: 'purple'
        });
        setActionItems(actions);
      }
      setLoading(false);
    }
    getData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  if (!user) return <div className="flex h-screen items-center justify-center bg-gray-50"><p className="text-gray-500">Please log in.</p></div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const teacherName = profile?.full_name?.split(' ')[0] || 'Teacher';
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  let npDate = '';
  try { npDate = new NepaliDate(new Date()).format('DD MMMM YYYY'); } catch { npDate = ''; }

  const getStatusStyles = (status: string) => {
    if (status === 'Completed') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'Mark Attendance') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getActionColor = (color: string) => {
    const colors: Record<string, string> = {
      amber: 'bg-amber-50 text-amber-600 border-amber-200',
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* ✅ 1. Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl flex items-center gap-2">
              {greeting}, <span className="text-blue-600">{teacherName} Sir/Madam</span> 👋
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Here's your teaching overview for today at <span className="font-medium text-gray-700">{school?.name || 'your school'}</span>.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 font-medium text-red-700 ring-1 ring-red-100">{npDate} B.S.</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 ring-1 ring-gray-200">
                <Calendar className="h-3.5 w-3.5 text-gray-500" /> {dateStr}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700 ring-1 ring-blue-100">
                <GraduationCap className="h-3.5 w-3.5" /> Academic Year 2083
              </span>
            </div>
          </div>

          {/* ✅ 2. Stats Grid */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">My Classes</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100"><BookOpen className="h-5 w-5" /></div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900 tabular-nums">{stats.totalClasses}</p>
              <p className="mt-2 text-xs text-gray-400">{stats.totalStudents} students total</p>
            </div>
            <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">Attendance Pending</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100"><ClipboardCheck className="h-5 w-5" /></div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-amber-700 tabular-nums">{stats.attendancePending}</p>
              <p className="mt-2 text-xs text-amber-600 font-medium">Mark before 10 AM</p>
            </div>
            <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">Marks Pending</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100"><FileText className="h-5 w-5" /></div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-purple-700 tabular-nums">{stats.marksPending}</p>
              <p className="mt-2 text-xs text-gray-400">Unit Test · Grade 10B</p>
            </div>
            <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">Active Assignments</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100"><BookOpen className="h-5 w-5" /></div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-emerald-700 tabular-nums">{stats.activeAssignments}</p>
              <p className="mt-2 text-xs text-emerald-600">12 submissions today</p>
            </div>
          </div>

          {/* ✅ 3. Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Left: Today's Classes (2/3 width) */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" /> Today's Classes
                </h3>
                <Link href="/teacher/timetable" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Full timetable <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {todayClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4 hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center h-12 w-16 rounded-lg bg-white border border-gray-200 text-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{cls.period.split(' ')[0]}</span>
                        <span className="text-sm font-bold text-gray-900">{cls.period.split(' ')[1]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{cls.class} · {cls.subject}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{cls.time}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${getStatusStyles(cls.status)}`}>
                        {cls.status === 'Completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {cls.status}
                      </span>
                      {cls.status === 'Mark Attendance' && (
                        <Link href="/teacher/attendance" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                          Mark Attendance
                        </Link>
                      )}
                      {cls.status === 'Completed' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Class Performance Snapshot (1/3 width) */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" /> Class Performance Snapshot
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                         formatter={(value: any) => [`${value}%`, 'Average Score']}
                            />
                    <Bar dataKey="avgScore" radius={[6, 6, 0, 0]}>
                      {classPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#10b981', '#06b6d4'][index % 4]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {classPerformance.map((cls) => (
                  <div key={cls.name} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500">Grade {cls.name}</p>
                    <p className="text-lg font-bold text-gray-900">{cls.avgScore}%</p>
                    <p className="text-[10px] text-gray-400">{cls.students} students · {cls.attendance}% att</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ✅ 4. Action Required Section */}
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" /> Action Required
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {actionItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={index} 
                    href={item.href}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${getActionColor(item.color)}`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 bg-white`}>
                      <Icon className={`h-5 w-5 ${item.color === 'amber' ? 'text-amber-600' : item.color === 'blue' ? 'text-blue-600' : item.color === 'red' ? 'text-red-600' : 'text-purple-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold leading-snug ${item.color === 'amber' ? 'text-amber-900' : item.color === 'blue' ? 'text-blue-900' : item.color === 'red' ? 'text-red-900' : 'text-purple-900'}`}>
                        {item.text}
                      </p>
                      <p className={`mt-1 text-xs font-bold ${item.color === 'amber' ? 'text-amber-700' : item.color === 'blue' ? 'text-blue-700' : item.color === 'red' ? 'text-red-700' : 'text-purple-700'}`}>
                        {item.action} →
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ✅ 5. My Classes Section */}
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" /> My Classes
              </h3>
              <p className="text-xs text-gray-500">Classes and sections you teach this academic year</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {classPerformance.map((cls) => (
                <div key={cls.name} className="rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-base font-bold text-gray-900">Grade {cls.name}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">Mathematics · {cls.students} students</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Avg. Score</p>
                      <p className="text-lg font-bold text-gray-900">{cls.avgScore}%</p>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${cls.avgScore}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Attendance</p>
                      <p className="text-lg font-bold text-gray-900">{cls.attendance}%</p>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${cls.attendance}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Next: Today 8:00
                    </p>
                    <div className="flex gap-2">
                      <Link href="/teacher/attendance" className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors">
                        Attendance
                      </Link>
                      <Link href="/teacher/marks" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                        Marks
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}