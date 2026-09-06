'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { Calendar, Clock, BookOpen, User, Download } from 'lucide-react';

// --- Mock Data (Based on your reference HTML) ---
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const periods = [
  { id: 1, time: '8:00' },
  { id: 2, time: '8:45' },
  { id: 3, time: '9:30' },
  { id: 4, time: '10:30' },
  { id: 5, time: '11:15' },
];

// Format: "DayIndex-PeriodId" -> Class Info
const scheduleData: Record<string, { subject: string; teacher: string; color: string } | null> = {
  '0-1': { subject: 'Math', teacher: 'H. Thapa', color: 'blue' },
  '0-2': { subject: 'English', teacher: 'S. Sharma', color: 'purple' },
  '0-3': { subject: 'Science', teacher: 'R. Adhikari', color: 'emerald' },
  '0-4': { subject: 'Nepali', teacher: 'G. Poudel', color: 'amber' },
  '0-5': { subject: 'Social', teacher: 'K. Magar', color: 'cyan' },

  '1-1': { subject: 'English', teacher: 'S. Sharma', color: 'purple' },
  '1-2': { subject: 'Math', teacher: 'H. Thapa', color: 'blue' },
  '1-3': { subject: 'Nepali', teacher: 'G. Poudel', color: 'amber' },
  '1-4': { subject: 'Science', teacher: 'R. Adhikari', color: 'emerald' },
  '1-5': { subject: 'Opt. Math', teacher: 'H. Thapa', color: 'pink' },

  '2-1': { subject: 'Science', teacher: 'R. Adhikari', color: 'emerald' },
  '2-2': { subject: 'Social', teacher: 'K. Magar', color: 'cyan' },
  '2-3': { subject: 'Math', teacher: 'H. Thapa', color: 'blue' },
  '2-4': { subject: 'English', teacher: 'S. Sharma', color: 'purple' },
  '2-5': { subject: 'Nepali', teacher: 'G. Poudel', color: 'amber' },

  '3-1': { subject: 'Nepali', teacher: 'G. Poudel', color: 'amber' },
  '3-2': { subject: 'Science', teacher: 'R. Adhikari', color: 'emerald' },
  '3-3': { subject: 'English', teacher: 'S. Sharma', color: 'purple' },
  '3-4': { subject: 'Math', teacher: 'H. Thapa', color: 'blue' },
  '3-5': { subject: 'Social', teacher: 'K. Magar', color: 'cyan' },

  '4-1': { subject: 'Math', teacher: 'H. Thapa', color: 'blue' },
  '4-2': { subject: 'English', teacher: 'S. Sharma', color: 'purple' },
  '4-3': { subject: 'Science', teacher: 'R. Adhikari', color: 'emerald' },
  '4-4': { subject: 'Social', teacher: 'K. Magar', color: 'cyan' },
  '4-5': { subject: 'Opt. Math', teacher: 'H. Thapa', color: 'pink' },
};

const colorStyles: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  amber: 'bg-amber-50 border-amber-200 text-amber-900',
  cyan: 'bg-cyan-50 border-cyan-200 text-cyan-900',
  pink: 'bg-pink-50 border-pink-200 text-pink-900',
};

export default function StudentTimetablePage() {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 0 = Mon, 4 = Fri
  const todayIndex = new Date().getDay() - 1; 

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) { setLoading(false); return; }

      const { data: profileData } = await supabase.from('profiles').select('school_id').eq('user_id', user.id).single();
      if (profileData?.school_id) {
        const { data: schoolData } = await supabase.from('schools').select('name').eq('id', profileData.school_id).single();
        setSchool(schoolData);
      }
      setLoading(false);
    }
    getData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  if (!user) return <div className="flex h-screen items-center justify-center bg-gray-50"><p className="text-gray-500">Please log in.</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">My Timetable</h1>
              <p className="mt-1.5 text-sm text-gray-500">Grade 10A · Weekly schedule</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" /> Export PDF
            </button>
          </div>

          {/* Timetable Grid */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                
                {/* Grid Header (Days) */}
                <div className="grid grid-cols-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-2" /> Period
                  </div>
                  {shortDays.map((day, index) => (
                    <div 
                      key={day} 
                      className={`p-4 text-center text-sm font-bold transition-colors ${
                        index === todayIndex ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'
                      }`}
                    >
                      {day}
                      {index === todayIndex && <span className="block text-[10px] font-normal text-blue-500 mt-0.5">Today</span>}
                    </div>
                  ))}
                </div>

                {/* Grid Body (Periods) */}
                <div className="divide-y divide-gray-100">
                  {periods.map((period) => (
                    <div key={period.id} className="grid grid-cols-6 min-h-[100px]">
                      {/* Time Column */}
                      <div className="p-3 flex flex-col items-center justify-center text-xs font-medium text-gray-500 border-r border-gray-100 bg-gray-50/30">
                        <span className="font-bold text-gray-900">{period.id}</span>
                        <span className="mt-1 text-[10px] text-gray-400">· {period.time}</span>
                      </div>

                      {/* Day Columns */}
                      {days.map((_, dayIndex) => {
                        const cellKey = `${dayIndex}-${period.id}`;
                        const classInfo = scheduleData[cellKey];
                        const isToday = dayIndex === todayIndex;

                        return (
                          <div 
                            key={dayIndex} 
                            className={`p-2 border-r border-gray-50 last:border-r-0 transition-colors ${
                              isToday ? 'bg-blue-50/20' : 'bg-white'
                            }`}
                          >
                            {classInfo ? (
                              <div className={`h-full rounded-xl border p-3 flex flex-col justify-between transition-all hover:shadow-sm cursor-pointer ${colorStyles[classInfo.color] || colorStyles.blue}`}>
                                <div>
                                  <p className="text-sm font-bold leading-tight">{classInfo.subject}</p>
                                </div>
                                <div className="mt-2 flex items-center gap-1 text-[10px] font-medium opacity-80">
                                  <User className="h-2.5 w-2.5" /> {classInfo.teacher}
                                </div>
                              </div>
                            ) : (
                              <div className="h-full rounded-xl border border-dashed border-gray-200 flex items-center justify-center p-2">
                                <span className="text-[10px] font-medium text-gray-400 text-center">Free Period</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Legend / Footer */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-gray-500">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-50 border border-blue-200"></div>
              <span>Today's Schedule</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-white border border-dashed border-gray-300"></div>
              <span>Free Periods</span>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}