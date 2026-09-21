'use client';

import { useState, useMemo } from 'react';
import { 
  Search, Eye, MessageSquare, Users, TrendingUp, BookOpen, 
  X, Phone, Mail, AlertCircle, CheckCircle, GraduationCap,
  Download
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import AccountRequestsPanel from '@/components/AccountRequestsPanel';

// --- Mock Data ---
const classes = ['All', 'Grade 10A', 'Grade 10B', 'Grade 9A', 'Grade 9B'];

const mockStudents = [
  { id: 's1', name: 'Aarav Sharma', rollNo: 1, class: 'Grade 10A', attendance: 96, lastScore: 42, maxScore: 50, status: 'Excellent', parentPhone: '9841000001', email: 'aarav.parent@email.com' },
  { id: 's2', name: 'Vivaan Singh', rollNo: 2, class: 'Grade 10A', attendance: 88, lastScore: 38, maxScore: 50, status: 'Good', parentPhone: '9841000002', email: 'vivaan.parent@email.com' },
  { id: 's3', name: 'Aditya Verma', rollNo: 3, class: 'Grade 10B', attendance: 92, lastScore: 45, maxScore: 50, status: 'Excellent', parentPhone: '9841000003', email: 'aditya.parent@email.com' },
  { id: 's4', name: 'Sai Patel', rollNo: 4, class: 'Grade 10B', attendance: 72, lastScore: 28, maxScore: 50, status: 'Needs Attention', parentPhone: '9841000004', email: 'sai.parent@email.com' },
  { id: 's5', name: 'Arjun Reddy', rollNo: 5, class: 'Grade 9A', attendance: 98, lastScore: 48, maxScore: 50, status: 'Excellent', parentPhone: '9841000005', email: 'arjun.parent@email.com' },
  { id: 's6', name: 'Reyansh Kumar', rollNo: 6, class: 'Grade 9A', attendance: 85, lastScore: 35, maxScore: 50, status: 'Good', parentPhone: '9841000006', email: 'reyansh.parent@email.com' },
  { id: 's7', name: 'Krishna Iyer', rollNo: 7, class: 'Grade 9B', attendance: 91, lastScore: 40, maxScore: 50, status: 'Good', parentPhone: '9841000007', email: 'krishna.parent@email.com' },
  { id: 's8', name: 'Ishaan Gupta', rollNo: 8, class: 'Grade 9B', attendance: 68, lastScore: 22, maxScore: 50, status: 'At Risk', parentPhone: '9841000008', email: 'ishaan.parent@email.com' },
  { id: 's9', name: 'Shaurya Joshi', rollNo: 9, class: 'Grade 10A', attendance: 94, lastScore: 44, maxScore: 50, status: 'Excellent', parentPhone: '9841000009', email: 'shaurya.parent@email.com' },
  { id: 's10', name: 'Atharv Pandey', rollNo: 10, class: 'Grade 10B', attendance: 78, lastScore: 31, maxScore: 50, status: 'Needs Attention', parentPhone: '9841000010', email: 'atharv.parent@email.com' },
  { id: 's11', name: 'Ananya Sharma', rollNo: 11, class: 'Grade 9A', attendance: 97, lastScore: 46, maxScore: 50, status: 'Excellent', parentPhone: '9841000011', email: 'ananya.parent@email.com' },
  { id: 's12', name: 'Diya Patel', rollNo: 12, class: 'Grade 9B', attendance: 89, lastScore: 39, maxScore: 50, status: 'Good', parentPhone: '9841000012', email: 'diya.parent@email.com' },
];

type Student = typeof mockStudents[0];

export default function TeacherStudentsPage() {
  const [selectedClass, setSelectedClass] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Filter Logic
  const filteredStudents = useMemo(() => {
    return mockStudents.filter((student) => {
      const matchesClass = selectedClass === 'All' || student.class === selectedClass;
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            student.rollNo.toString().includes(searchQuery);
      return matchesClass && matchesSearch;
    });
  }, [selectedClass, searchQuery]);

  // Stats Calculation
  const stats = useMemo(() => {
    const total = filteredStudents.length;
    const avgAtt = total > 0 ? Math.round(filteredStudents.reduce((acc, s) => acc + s.attendance, 0) / total) : 0;
    const avgScore = total > 0 ? Math.round((filteredStudents.reduce((acc, s) => acc + (s.lastScore / s.maxScore) * 100, 0) / total)) : 0;
    const atRisk = filteredStudents.filter(s => s.attendance < 75 || (s.lastScore / s.maxScore) < 0.5).length;
    return { total, avgAtt, avgScore, atRisk };
  }, [filteredStudents]);

  const getStatusBadge = (status: string) => {
    if (status === 'Excellent') return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200"><CheckCircle className="h-3 w-3" /> Excellent</span>;
    if (status === 'Good') return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200"><CheckCircle className="h-3 w-3" /> Good</span>;
    if (status === 'Needs Attention') return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200"><AlertCircle className="h-3 w-3" /> Needs Attention</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200"><AlertCircle className="h-3 w-3" /> At Risk</span>;
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">My Students</h1>
              <p className="mt-1.5 text-sm text-gray-500">Students across all your classes for Academic Year 2083.</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" /> Export List
            </button>
          </div>

          <AccountRequestsPanel role="student" />

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Users className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Total Students</p><p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.total}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Avg. Attendance</p><p className="text-2xl font-bold text-emerald-700 tabular-nums">{stats.avgAtt}%</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><BookOpen className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Avg. Score</p><p className="text-2xl font-bold text-purple-700 tabular-nums">{stats.avgScore}%</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><AlertCircle className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">At Risk</p><p className="text-2xl font-bold text-red-700 tabular-nums">{stats.atRisk}</p></div>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Class Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {classes.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    selectedClass === cls
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by name or roll no..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
              />
            </div>
          </div>

          {/* Students Table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4"><Users className="h-8 w-8 text-gray-400" /></div>
                <h3 className="text-lg font-semibold text-gray-900">No students found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium text-gray-500">Student</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Class</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Attendance</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Last Score</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                      <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{student.name}</p>
                              <p className="text-xs text-gray-500">Roll No: {student.rollNo.toString().padStart(2, '0')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{student.class}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  student.attendance >= 90 ? 'bg-green-500' : 
                                  student.attendance >= 75 ? 'bg-amber-500' : 'bg-red-500'
                                }`} 
                                style={{ width: `${student.attendance}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-700">{student.attendance}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">{student.lastScore}</span>
                          <span className="text-xs text-gray-400"> / {student.maxScore}</span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(student.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedStudent(student)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ✅ Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-bold text-blue-600 shadow-lg">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-blue-100 text-sm flex items-center gap-2 mt-1">
                    <GraduationCap className="h-4 w-4" /> {selectedStudent.class} · Roll No: {selectedStudent.rollNo.toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-1">Attendance</p>
                  <p className="text-xl font-bold text-gray-900">{selectedStudent.attendance}%</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-1">Last Score</p>
                  <p className="text-xl font-bold text-gray-900">{selectedStudent.lastScore}/{selectedStudent.maxScore}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <div className="mt-1 flex justify-center">{getStatusBadge(selectedStudent.status)}</div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Parent / Guardian Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-semibold text-gray-900">{selectedStudent.parentPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-semibold text-gray-900 truncate">{selectedStudent.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:bg-blue-50 hover:border-blue-200 transition-all group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200"><MessageSquare className="h-5 w-5" /></div>
                    <div><p className="font-semibold text-gray-900">Message Parent</p><p className="text-xs text-gray-500">Send SMS or Email</p></div>
                  </button>
                  <button className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:bg-purple-50 hover:border-purple-200 transition-all group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200"><BookOpen className="h-5 w-5" /></div>
                    <div><p className="font-semibold text-gray-900">View Marks</p><p className="text-xs text-gray-500">Full score history</p></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
