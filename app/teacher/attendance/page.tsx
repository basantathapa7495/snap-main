'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { 
  Calendar, CheckCircle, XCircle, Clock, Users, Save, 
  Check, ChevronDown, AlertCircle
} from 'lucide-react';

// --- Mock Data (Replace with Supabase queries later) ---
const mockClasses = [
  { id: 'c1', name: 'Grade 10A', students: 42 },
  { id: 'c2', name: 'Grade 10B', students: 40 },
  { id: 'c3', name: 'Grade 9A', students: 45 },
  { id: 'c4', name: 'Grade 9B', students: 43 },
];

const generateMockStudents = (classId: string, count: number) => {
  const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Sai', 'Arjun', 'Reyansh', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Myra', 'Pari', 'Anaya', 'Navya', 'Kiara', 'Ishita'];
  const lastNames = ['Sharma', 'Singh', 'Verma', 'Patel', 'Reddy', 'Kumar', 'Iyer', 'Gupta', 'Joshi', 'Pandey'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `STU-${classId}-${i + 1}`,
    rollNo: i + 1,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    status: 'unmarked' as 'present' | 'absent' | 'late' | 'unmarked'
  }));
};

export default function TeacherAttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState(mockClasses[0].id);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load students when class changes
  useEffect(() => {
    const selectedClass = mockClasses.find(c => c.id === selectedClassId);
    if (selectedClass) {
      // TODO: Fetch real students from Supabase
      // const { data } = await supabase.from('students').select('*').eq('class_id', selectedClassId);
      setStudents(generateMockStudents(selectedClassId, selectedClass.students));
    }
  }, [selectedClassId]);

  // Calculate real-time stats
  const stats = useMemo(() => {
    const present = students.filter(s => s.status === 'present').length;
    const absent = students.filter(s => s.status === 'absent').length;
    const late = students.filter(s => s.status === 'late').length;
    const unmarked = students.filter(s => s.status === 'unmarked').length;
    const totalMarked = present + absent + late;
    const percentage = totalMarked > 0 ? Math.round(((present + late) / totalMarked) * 100) : 0;
    
    return { present, absent, late, unmarked, percentage };
  }, [students]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
  };

  const handleSubmit = async () => {
    if (stats.unmarked > 0) {
      alert(`Please mark attendance for all ${stats.unmarked} remaining students.`);
      return;
    }

    setIsSubmitting(true);
    // TODO: Save to Supabase 'attendance' table
    // await supabase.from('attendance').insert(students.map(s => ({ ... })));
    
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const selectedClassName = mockClasses.find(c => c.id === selectedClassId)?.name || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-32">
          
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Attendance</h1>
              <p className="mt-1.5 text-sm text-gray-500">Mark and review attendance for your classes.</p>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input 
                type="date" 
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Class Selector Tabs */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {mockClasses.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  selectedClassId === cls.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cls.name}
                <span className={`ml-2 text-xs ${selectedClassId === cls.id ? 'text-blue-100' : 'text-gray-400'}`}>
                  ({cls.students})
                </span>
              </button>
            ))}
          </div>

          {/* Real-time Stats Grid */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-gray-500">Present</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.present}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <XCircle className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-gray-500">Absent</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.absent}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Clock className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-gray-500">Late</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.late}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Users className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-gray-500">Attendance %</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.percentage}%</p>
            </div>
          </div>

          {/* Main Attendance Card */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            
            {/* Card Header & Quick Actions */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Mark Attendance — {selectedClassName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{stats.unmarked} students remaining to mark</p>
              </div>
              <button 
                onClick={markAllPresent}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Check className="h-3.5 w-3.5" /> Mark All Present
              </button>
            </div>

            {/* Student List */}
            <div className="divide-y divide-gray-100">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">Roll No: {student.rollNo}</p>
                    </div>
                  </div>

                  {/* Status Toggles */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        student.status === 'present' 
                          ? 'bg-green-600 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'late')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        student.status === 'late' 
                          ? 'bg-amber-500 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      Late
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        student.status === 'absent' 
                          ? 'bg-red-600 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Sticky Bottom Submit Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur-md p-4 lg:left-64 lg:p-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {stats.unmarked === 0 ? (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" /> All students marked!
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" /> {stats.unmarked} students left to mark
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500">Attendance for {selectedClassName} on {attendanceDate}</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || stats.unmarked > 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4" /> Saved Successfully!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Submit Attendance
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Toast Notification */}
        {showSuccess && (
          <div className="fixed top-24 right-6 z-50 flex items-center gap-3 rounded-xl bg-white border border-green-200 p-4 shadow-xl animate-in slide-in-from-right fade-in duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Attendance Saved!</p>
              <p className="text-xs text-gray-500">Successfully recorded for {selectedClassName}.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}