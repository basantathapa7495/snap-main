'use client';

import { useState } from 'react';
import { 
  Calendar, Clock, BookOpen, Users, MapPin, ChevronLeft, 
  ChevronRight, Coffee, GraduationCap, Download
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Mock Data ---
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const periods = [
  { id: 1, time: '8:00 – 8:45' },
  { id: 2, time: '8:45 – 9:30' },
  { id: 3, time: '9:30 – 10:15' },
  { id: 4, time: '10:15 – 10:30', isBreak: true, label: 'Short Break' },
  { id: 5, time: '10:30 – 11:15' },
  { id: 6, time: '11:15 – 12:00' },
  { id: 7, time: '12:00 – 12:45', isBreak: true, label: 'Lunch Break' },
  { id: 8, time: '12:45 – 13:30' },
  { id: 9, time: '13:30 – 14:15' },
];

// Format: "DayIndex-PeriodId" -> Class Info
const scheduleData: Record<string, { subject: string; class: string; room: string; color: string } | null> = {
  '0-1': { subject: 'Mathematics', class: 'Grade 10A', room: 'Room 12', color: 'blue' },
  '0-3': { subject: 'Mathematics', class: 'Grade 9A', room: 'Room 10', color: 'blue' },
  '0-5': { subject: 'Mathematics', class: 'Grade 10B', room: 'Room 12', color: 'blue' },
  '0-8': { subject: 'Mathematics', class: 'Grade 9B', room: 'Room 11', color: 'blue' },

  '1-2': { subject: 'Mathematics', class: 'Grade 10B', room: 'Room 12', color: 'blue' },
  '1-3': { subject: 'Mathematics', class: 'Grade 9A', room: 'Room 10', color: 'blue' },
  '1-6': { subject: 'Mathematics', class: 'Grade 10A', room: 'Room 12', color: 'blue' },
  '1-8': { subject: 'Mathematics', class: 'Grade 9B', room: 'Room 11', color: 'blue' },

  '2-1': { subject: 'Mathematics', class: 'Grade 10A', room: 'Room 12', color: 'blue' },
  '2-2': { subject: 'Mathematics', class: 'Grade 10B', room: 'Room 12', color: 'blue' },
  '2-5': { subject: 'Mathematics', class: 'Grade 9A', room: 'Room 10', color: 'blue' },
  '2-9': { subject: 'Mathematics', class: 'Grade 9B', room: 'Room 11', color: 'blue' },

  '3-1': { subject: 'Mathematics', class: 'Grade 10A', room: 'Room 12', color: 'blue' },
  '3-3': { subject: 'Mathematics', class: 'Grade 9A', room: 'Room 10', color: 'blue' },
  '3-6': { subject: 'Mathematics', class: 'Grade 10B', room: 'Room 12', color: 'blue' },
  '3-8': { subject: 'Mathematics', class: 'Grade 9B', room: 'Room 11', color: 'blue' },

  '4-2': { subject: 'Mathematics', class: 'Grade 10B', room: 'Room 12', color: 'blue' },
  '4-3': { subject: 'Mathematics', class: 'Grade 9A', room: 'Room 10', color: 'blue' },
  '4-5': { subject: 'Mathematics', class: 'Grade 10A', room: 'Room 12', color: 'blue' },
  '4-9': { subject: 'Mathematics', class: 'Grade 9B', room: 'Room 11', color: 'blue' },
};

const colorStyles: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100',
  purple: 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100',
};

export default function TeacherTimetablePage() {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const todayIndex = new Date().getDay() - 1; // 0 = Mon, 4 = Fri

  const totalClasses = Object.values(scheduleData).filter(Boolean).length;
  const totalTeachingHours = (totalClasses * 45) / 60;

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
              <p className="mt-1.5 text-sm text-gray-500">Weekly teaching schedule — Academic Year 2083</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" /> Export PDF
              </button>
            </div>
          </div>

          {/* Week Navigation & Stats */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center sm:text-left">
                <p className="text-sm font-bold text-gray-900">Week of 18 – 22 Bhadra, 2083</p>
                <p className="text-xs text-gray-500">Academic Year 2083</p>
              </div>
              <button 
                onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-6 border-t border-gray-100 pt-4 sm:border-t-0 sm:pt-0">
              <div className="text-center sm:text-left">
                <p className="text-xs font-medium text-gray-500">Total Classes</p>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{totalClasses}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-medium text-gray-500">Teaching Hours</p>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{totalTeachingHours.toFixed(1)}h</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-medium text-gray-500">Free Periods</p>
                <p className="text-xl font-bold text-emerald-600 tabular-nums">12</p>
              </div>
            </div>
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
                  {periods.map((period) => {
                    if (period.isBreak) {
                      return (
                        <div key={period.id} className="grid grid-cols-6 bg-amber-50/30">
                          <div className="p-3 flex items-center justify-center text-xs font-medium text-amber-700 border-r border-amber-100">
                            {period.time}
                          </div>
                          <div className="col-span-5 p-2 flex items-center justify-center">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                              <Coffee className="h-3 w-3" /> {period.label}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={period.id} className="grid grid-cols-6 min-h-[100px]">
                        {/* Time Column */}
                        <div className="p-3 flex flex-col items-center justify-center text-xs font-medium text-gray-500 border-r border-gray-100 bg-gray-50/30">
                          <span className="font-bold text-gray-900">P{period.id}</span>
                          <span className="mt-1 text-[10px] text-gray-400">{period.time}</span>
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
                                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">{classInfo.class}</p>
                                    <p className="text-sm font-bold leading-tight">{classInfo.subject}</p>
                                  </div>
                                  <div className="mt-2 flex items-center gap-1 text-[10px] font-medium opacity-80">
                                    <MapPin className="h-2.5 w-2.5" /> {classInfo.room}
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
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Legend / Footer */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-gray-500">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-100 border border-blue-300"></div>
              <span>My Classes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-amber-100 border border-amber-300"></div>
              <span>Breaks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-white border border-dashed border-gray-300"></div>
              <span>Free Periods</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-50 border border-blue-200"></div>
              <span>Today's Schedule</span>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}