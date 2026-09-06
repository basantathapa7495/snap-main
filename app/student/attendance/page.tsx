'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { 
  Calendar, CheckCircle, XCircle, Clock, TrendingUp, 
  BookOpen, AlertCircle 
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// --- Mock Data ---
const stats = {
  overall: 96,
  present: 142,
  absent: 4,
  late: 2,
};

const monthlyTrendData = [
  { month: 'Jestha', rate: 98 },
  { month: 'Ashadh', rate: 95 },
  { month: 'Shrawan', rate: 97 },
  { month: 'Bhadra', rate: 96 },
];

const subjectAttendance = [
  { name: 'Mathematics', rate: 96, color: 'bg-blue-500' },
  { name: 'English', rate: 98, color: 'bg-purple-500' },
  { name: 'Science', rate: 94, color: 'bg-emerald-500' },
  { name: 'Nepali', rate: 97, color: 'bg-amber-500' },
  { name: 'Social Studies', rate: 95, color: 'bg-cyan-500' },
];

const recentAttendance = [
  { id: 1, date: '19 Bhadra', day: 'Monday', status: 'Present', remarks: '—' },
  { id: 2, date: '18 Bhadra', day: 'Sunday', status: 'Present', remarks: '—' },
  { id: 3, date: '17 Bhadra', day: 'Saturday', status: 'Holiday', remarks: 'Weekly holiday' },
  { id: 4, date: '16 Bhadra', day: 'Friday', status: 'Present', remarks: '—' },
  { id: 5, date: '15 Bhadra', day: 'Thursday', status: 'Late', remarks: 'Arrived 8:15' },
  { id: 6, date: '12 Bhadra', day: 'Monday', status: 'Absent', remarks: 'Sick leave' },
  { id: 7, date: '11 Bhadra', day: 'Sunday', status: 'Present', remarks: '—' },
  { id: 8, date: '10 Bhadra', day: 'Saturday', status: 'Holiday', remarks: 'Weekly holiday' },
];

export default function StudentAttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) { setLoading(false); return; }

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('user_id', user.id)
          .single();
          
        if (profileData?.school_id) {
          const { data: schoolData } = await supabase
            .from('schools')
            .select('name')
            .eq('id', profileData.school_id)
            .single();
          setSchool(schoolData);
        }
      }
      setLoading(false);
    }
    getData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  if (!user) return <div className="flex h-screen items-center justify-center bg-gray-50"><p className="text-gray-500">Please log in.</p></div>;

  const getStatusBadge = (status: string) => {
    if (status === 'Present') return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200"><CheckCircle className="h-3 w-3" /> Present</span>;
    if (status === 'Absent') return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200"><XCircle className="h-3 w-3" /> Absent</span>;
    if (status === 'Late') return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200"><Clock className="h-3 w-3" /> Late</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 border border-gray-200"><Calendar className="h-3 w-3" /> Holiday</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Attendance</h1>
            <p className="mt-1.5 text-sm text-gray-500">Your attendance record for Academic Year 2083.</p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><TrendingUp className="h-5 w-5" /></div>
                <p className="text-sm font-medium text-gray-500">Overall</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{stats.overall}%</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600"><CheckCircle className="h-5 w-5" /></div>
                <p className="text-sm font-medium text-gray-500">Present Days</p>
              </div>
              <p className="text-3xl font-bold text-green-700 tabular-nums">{stats.present}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><XCircle className="h-5 w-5" /></div>
                <p className="text-sm font-medium text-gray-500">Absent</p>
              </div>
              <p className="text-3xl font-bold text-red-700 tabular-nums">{stats.absent}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div>
                <p className="text-sm font-medium text-gray-500">Late</p>
              </div>
              <p className="text-3xl font-bold text-amber-700 tabular-nums">{stats.late}</p>
            </div>
          </div>

          {/* Charts & Subject Attendance Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Monthly Trend Chart */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Trend</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`${value}%`, 'Attendance']}
                    />
                    <Bar dataKey="rate" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject-wise Attendance */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" /> Subject-wise
              </h3>
              <div className="space-y-5">
                {subjectAttendance.map((subject) => (
                  <div key={subject.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">{subject.name}</span>
                      <span className="font-bold text-gray-900">{subject.rate}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${subject.color}`} style={{ width: `${subject.rate}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Attendance Table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h3 className="text-base font-bold text-gray-900">Recent Attendance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-500">Date</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Day</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{record.date}</td>
                      <td className="px-6 py-4 text-gray-600">{record.day}</td>
                      <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                      <td className="px-6 py-4 text-gray-500">{record.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}