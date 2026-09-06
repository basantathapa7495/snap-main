'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
// @ts-ignore
import NepaliDate from 'nepali-date-converter';
import {
  BookOpen,
  ClipboardList,
  FileText,
  Wallet,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  DollarSign,
  ArrowRight
} from 'lucide-react';

// Recharts Components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function StudentDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) { setLoading(false); return; }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);

      if (profileData?.school_id) {
        const { data: schoolData } = await supabase
          .from('schools')
          .select('name')
          .eq('id', profileData.school_id)
          .single();
        setSchool(schoolData);
      }
      setLoading(false);
    }
    getData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  if (!user) return <div className="flex h-screen items-center justify-center bg-gray-50"><p className="text-gray-500">Please log in.</p></div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const studentName = profile?.full_name?.split(' ')[0] || 'Student';
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  let npDate = '';
  try { npDate = new NepaliDate(new Date()).format('DD MMMM YYYY'); } catch { npDate = ''; }

  // Mock Data for UI (Will be replaced with real DB queries later)
  const stats = {
    attendance: 96,
    avgScore: 78,
    pendingTasks: 2,
    feeStatus: 'Paid'
  };

  const todaysClasses = [
    { id: 1, period: 'Period 1', time: '8:00 – 8:45', subject: 'Mathematics', teacher: 'Hari B. Thapa', status: 'Done', color: 'green' },
    { id: 2, period: 'Period 2', time: '8:45 – 9:30', subject: 'English', teacher: 'Sunita D. Sharma', status: 'Now', color: 'blue' },
    { id: 3, period: 'Period 3', time: '9:30 – 10:15', subject: 'Science', teacher: 'Ram P. Adhikari', status: 'Upcoming', color: 'gray' },
    { id: 4, period: 'Period 4', time: '10:30 – 11:15', subject: 'Nepali', teacher: 'Gita K. Poudel', status: 'Upcoming', color: 'gray' },
  ];

  const subjectPerformance = [
    { name: 'Math', score: 78, color: '#3b82f6' },
    { name: 'English', score: 82, color: '#8b5cf6' },
    { name: 'Science', score: 71, color: '#f59e0b' },
    { name: 'Nepali', score: 85, color: '#10b981' },
    { name: 'Social', score: 76, color: '#06b6d4' },
    { name: 'Opt Math', score: 80, color: '#a855f7' },
  ];

  const actionItems = [
    { id: 1, icon: FileText, text: 'Assignment due: Algebra — Quadratic Equations', action: 'Due 22 Bhadra', href: '/student/assignments', color: 'blue' },
    { id: 2, icon: ClipboardList, text: 'Unit Test 2 on 21 Bhadra', action: 'View schedule', href: '/student/exams', color: 'amber' },
    { id: 3, icon: MessageSquare, text: 'New notice: Parent-teacher meeting this Saturday', action: 'Read notice', href: '/student/notices', color: 'purple' },
    { id: 4, icon: DollarSign, text: 'Next fee installment due 25 Bhadra', action: 'View fees', href: '/student/fees', color: 'emerald' },
  ];

  const getStatusStyles = (status: string) => {
    if (status === 'Done') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'Now') return 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl flex items-center gap-2">
              {greeting}, <span className="text-blue-600">{studentName}</span> 👋
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Here's your academic overview for today at <span className="font-medium text-gray-700">{school?.name || 'your school'}</span>.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 font-medium text-red-700 ring-1 ring-red-100">{npDate} B.S.</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 ring-1 ring-gray-200">
                <Calendar className="h-3.5 w-3.5 text-gray-500" /> {dateStr}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700 ring-1 ring-blue-100">
                <BookOpen className="h-3.5 w-3.5" /> Academic Year 2083
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Attendance</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums">{stats.attendance}%</p>
              <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Good standing</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Overall Average</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums">{stats.avgScore}%</p>
              <p className="mt-2 text-xs text-gray-500">B+ grade</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums">{stats.pendingTasks}</p>
              <p className="mt-2 text-xs text-red-600 font-medium">Due soon</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Fee Status</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600 tabular-nums">{stats.feeStatus}</p>
              <p className="mt-2 text-xs text-gray-500">This month</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Left: Today's Classes (2/3 width) */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" /> Today's Classes
                </h3>
                <Link href="/student/timetable" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Full timetable <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {todaysClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4 hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center h-12 w-16 rounded-lg bg-white border border-gray-200 text-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{cls.period.split(' ')[0]}</span>
                        <span className="text-sm font-bold text-gray-900">{cls.period.split(' ')[1]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{cls.subject} <span className="text-gray-400 font-normal">· {cls.time}</span></p>
                        <p className="text-xs text-gray-500 mt-0.5">{cls.teacher}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${getStatusStyles(cls.status)}`}>
                        {cls.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Subject Performance (1/3 width) */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" /> Subject Performance
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`${value}%`, 'Score']}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {subjectPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Action Required Section */}
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
                    className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 transition-all hover:shadow-md hover:bg-white group"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${
                      item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                      item.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                      item.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">{item.text}</p>
                      <p className="mt-1 text-xs font-bold text-gray-500">
                        {item.action} →
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}