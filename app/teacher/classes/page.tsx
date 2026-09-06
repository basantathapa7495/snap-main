'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { 
  School, Users, TrendingUp, ClipboardList, FileText, 
  Clock, CheckCircle, BarChart3, ChevronRight
} from 'lucide-react';

// --- Mock Data (Replace with Supabase query later) ---
const mockClasses = [
  { 
    id: 'c1', 
    name: 'Grade 10A', 
    subject: 'Mathematics', 
    students: 42, 
    avgScore: 76, 
    attendance: 94, 
    nextClass: 'Today 8:00',
    status: 'Active'
  },
  { 
    id: 'c2', 
    name: 'Grade 10B', 
    subject: 'Mathematics', 
    students: 40, 
    avgScore: 71, 
    attendance: 91, 
    nextClass: 'Today 11:15',
    status: 'Active'
  },
  { 
    id: 'c3', 
    name: 'Grade 9A', 
    subject: 'Mathematics', 
    students: 45, 
    avgScore: 78, 
    attendance: 95, 
    nextClass: 'Today 9:30',
    status: 'Active'
  },
  { 
    id: 'c4', 
    name: 'Grade 9B', 
    subject: 'Mathematics', 
    students: 43, 
    avgScore: 74, 
    attendance: 92, 
    nextClass: 'Today 13:30',
    status: 'Active'
  },
];

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState(mockClasses);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch real classes assigned to this teacher from Supabase
    // const fetchClasses = async () => { ... }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">My Classes</h1>
              <p className="mt-1.5 text-sm text-gray-500">Classes and sections you teach this academic year.</p>
            </div>
            <Link 
              href="/teacher/timetable" 
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Clock className="h-4 w-4" /> View Full Timetable
            </Link>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {classes.map((cls) => (
              <div 
                key={cls.id} 
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
              >
                {/* Top: Class Info & Status */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <School className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        {cls.subject} · <Users className="h-3.5 w-3.5" /> {cls.students} students
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200">
                    <CheckCircle className="h-3 w-3" /> {cls.status}
                  </span>
                </div>

                {/* Middle: Metrics (Avg Score & Attendance) */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Avg Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-500">Avg. Score</p>
                      <p className="text-sm font-bold text-gray-900">{cls.avgScore}%</p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${cls.avgScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Attendance */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-500">Attendance</p>
                      <p className="text-sm font-bold text-gray-900">{cls.attendance}%</p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          cls.attendance >= 90 ? 'bg-emerald-500' : cls.attendance >= 75 ? 'bg-amber-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${cls.attendance}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Bottom: Next Class & Actions */}
                <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5 text-gray-400" /> 
                    Next: <span className="font-semibold text-gray-700">{cls.nextClass}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/teacher/attendance?class=${cls.id}`} 
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <ClipboardList className="h-3.5 w-3.5" /> Attendance
                    </Link>
                    <Link 
                      href={`/teacher/marks?class=${cls.id}`} 
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                    >
                      <FileText className="h-3.5 w-3.5" /> Marks
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State (Fallback if no classes) */}
          {classes.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <School className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No classes assigned</h3>
              <p className="mt-1 text-sm text-gray-500 max-w-sm">
                You haven't been assigned to any classes yet. Please contact your school administrator.
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}