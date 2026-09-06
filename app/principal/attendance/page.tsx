'use client';

import { useState, useMemo } from 'react';
import { 
  Users, UserCheck, UserX, Clock, Calendar, Filter, Download, 
  GraduationCap, AlertTriangle, Search
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Mock Data ---
const mockClassAttendance = [
  { class: 'Class 10', present: 42, absent: 3, percentage: 93 },
  { class: 'Class 9', present: 38, absent: 4, percentage: 90 },
  { class: 'Class 8', present: 35, absent: 6, percentage: 85 },
  { class: 'Class 7', present: 30, absent: 5, percentage: 86 },
  { class: 'Class 6', present: 28, absent: 2, percentage: 93 },
  { class: 'Class 5', present: 25, absent: 1, percentage: 96 },
  { class: 'Class 4', present: 22, absent: 3, percentage: 88 },
  { class: 'Class 3', present: 20, absent: 2, percentage: 91 },
  { class: 'Class 2', present: 18, absent: 1, percentage: 95 },
  { class: 'Class 1', present: 15, absent: 0, percentage: 100 },
];

const mockLowAttendanceStudents = [
  { id: 'STU1042', name: 'Rahul Sharma', class: 10, section: 'A', attendance: 62 },
  { id: 'STU1089', name: 'Priya Patel', class: 9, section: 'B', attendance: 68 },
  { id: 'STU1102', name: 'Amit Verma', class: 8, section: 'A', attendance: 71 },
  { id: 'STU1055', name: 'Sneha Gupta', class: 10, section: 'C', attendance: 73 },
  { id: 'STU1120', name: 'Vikram Singh', class: 7, section: 'A', attendance: 74 },
];

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const stats = {
    studentsPresent: 273,
    studentsAbsent: 27,
    teachersPresent: 14,
    teachersAbsent: 1,
  };

  // Filter Low Attendance Students
  const filteredLowAttendance = mockLowAttendanceStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedClass === 'All' || s.class.toString() === selectedClass.replace('Class ', ''))
  );

  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-700 bg-green-50 border-green-200';
    if (percentage >= 75) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Attendance</h1>
              <p className="mt-1.5 text-sm text-gray-500">Track daily attendance for students and teachers.</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
              <UserCheck className="h-4 w-4" /> Mark Attendance
            </button>
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600"><UserCheck className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Students Present</p><p className="text-2xl font-bold text-green-700 tabular-nums">{stats.studentsPresent}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><UserX className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Students Absent</p><p className="text-2xl font-bold text-red-700 tabular-nums">{stats.studentsAbsent}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Users className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Teachers Present</p><p className="text-2xl font-bold text-blue-700 tabular-nums">{stats.teachersPresent}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Clock className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Teachers Absent/Late</p><p className="text-2xl font-bold text-orange-700 tabular-nums">{stats.teachersAbsent}</p></div>
              </div>
            </div>
          </div>

          {/* Toolbar: Filters & Export */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full">
              <div className="relative w-full sm:w-48">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                />
              </div>
              <div className="relative w-full sm:w-40">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="All">All Classes</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(c => <option key={c} value={`Class ${c}`}>Class {c}</option>)}
                </select>
              </div>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto">
              <Download className="h-4 w-4" /> Export Report
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Left: Class-wise Attendance Progress Bars */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Class-wise Attendance</h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">Today</span>
              </div>
              
              <div className="space-y-5">
                {mockClassAttendance
                  .filter(c => selectedClass === 'All' || c.class === selectedClass)
                  .map((cls) => (
                  <div key={cls.class}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-900">{cls.class}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{cls.present} Present · {cls.absent} Absent</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getTextColor(cls.percentage)}`}>
                          {cls.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getBarColor(cls.percentage)} transition-all duration-500`} 
                        style={{ width: `${cls.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Low Attendance Students Table */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" /> Low Attendance
                </h3>
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {'< 75%'}
                </span>
              </div>

              {/* Search inside the card */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search student..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                />
              </div>

              <div className="flex-1 overflow-y-auto max-h-[400px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-medium text-gray-500 text-xs">Student</th>
                      <th className="px-3 py-2 font-medium text-gray-500 text-xs text-right">Att.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLowAttendance.length === 0 ? (
                      <tr><td colSpan={2} className="px-3 py-8 text-center text-gray-500 text-xs">No students found</td></tr>
                    ) : (
                      filteredLowAttendance.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-xs leading-tight">{student.name}</p>
                                <p className="text-[10px] text-gray-500">Class {student.class}-{student.section}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                              {student.attendance}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <button className="mt-4 w-full rounded-lg border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                View Full Report →
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}