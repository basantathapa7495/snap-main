'use client';

import { useState, useMemo } from 'react';
import { 
  GraduationCap, Calendar, CheckCircle, Clock, AlertCircle, Plus, 
  FileText, Download, Eye, Edit3, Trophy, TrendingUp, TrendingDown,
  X, BookOpen, Users, BarChart3
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Mock Data ---
const mockExams = [
  { id: 1, name: '1st Terminal Examination', type: 'Terminal', status: 'Completed', date: 'Aug 10 - Aug 15, 2081', classes: 10, subjects: 8, students: 320, passRate: 88 },
  { id: 2, name: 'Unit Test 2', type: 'Unit Test', status: 'Ongoing', date: 'Sep 05 - Sep 07, 2081', classes: 10, subjects: 4, students: 320, passRate: 0 },
  { id: 3, name: 'Final Examination 2081', type: 'Final', status: 'Upcoming', date: 'Dec 15 - Dec 25, 2081', classes: 10, subjects: 8, students: 320, passRate: 0 },
];

const mockTopPerformers = [
  { rank: 1, name: 'Aarav Sharma', class: '10-A', gpa: 4.0, percentage: 98 },
  { rank: 2, name: 'Priya Patel', class: '9-B', gpa: 3.95, percentage: 96 },
  { rank: 3, name: 'Rahul Verma', class: '10-A', gpa: 3.9, percentage: 95 },
];

const mockSubjectStats = [
  { name: 'Mathematics', avg: 82, trend: 'up' },
  { name: 'Science', avg: 78, trend: 'down' },
  { name: 'English', avg: 85, trend: 'up' },
  { name: 'Social Studies', avg: 88, trend: 'up' },
];

export default function ExamsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  // Stats
  const stats = {
    totalExams: mockExams.length,
    upcoming: mockExams.filter(e => e.status === 'Upcoming').length,
    ongoing: mockExams.filter(e => e.status === 'Ongoing').length,
    completed: mockExams.filter(e => e.status === 'Completed').length,
  };

  const filteredExams = activeTab === 'All' ? mockExams : mockExams.filter(e => e.status === activeTab);

  const getStatusBadge = (status: string) => {
    if (status === 'Upcoming') return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200"><Clock className="h-3 w-3" /> Upcoming</span>;
    if (status === 'Ongoing') return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200"><AlertCircle className="h-3 w-3" /> Ongoing</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200"><CheckCircle className="h-3 w-3" /> Completed</span>;
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Exams & Results</h1>
              <p className="mt-1.5 text-sm text-gray-500">Manage examinations, enter marks, and generate report cards.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" /> Import Marks
              </button>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" /> Create Exam
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FileText className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Total Exams</p><p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.totalExams}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Ongoing</p><p className="text-2xl font-bold text-amber-700 tabular-nums">{stats.ongoing}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600"><CheckCircle className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Completed</p><p className="text-2xl font-bold text-green-700 tabular-nums">{stats.completed}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><Trophy className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">School Pass Rate</p><p className="text-2xl font-bold text-purple-700 tabular-nums">88%</p></div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Left: Exam Management (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Exam List */}
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Exam Management</h3>
                  </div>
                  {/* Tabs */}
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                    {['All', 'Upcoming', 'Ongoing', 'Completed'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {filteredExams.map((exam) => (
                    <div key={exam.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-base font-bold text-gray-900">{exam.name}</h4>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" /> {exam.date}
                          </p>
                        </div>
                        {getStatusBadge(exam.status)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {exam.classes} Classes</span>
                        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {exam.subjects} Subjects</span>
                        <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {exam.students} Students</span>
                        {exam.status === 'Completed' && <span className="font-semibold text-green-600">{exam.passRate}% Pass Rate</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        {exam.status === 'Ongoing' && (
                          <button className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 border border-amber-200">
                            <Edit3 className="h-3.5 w-3.5" /> Enter Marks
                          </button>
                        )}
                        {exam.status === 'Completed' && (
                          <>
                            <button className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 border border-green-200">
                              <CheckCircle className="h-3.5 w-3.5" /> Publish Results
                            </button>
                            <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200">
                              <FileText className="h-3.5 w-3.5" /> Generate Report Cards
                            </button>
                          </>
                        )}
                        <button className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 ml-auto">
                          <Eye className="h-3.5 w-3.5" /> View Routine
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Results Overview (1/3 width) */}
            <div className="space-y-6">
              
              {/* Top Performers */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" /> Top Performers
                </h3>
                <div className="space-y-4">
                  {mockTopPerformers.map((student) => (
                    <div key={student.rank} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          student.rank === 1 ? 'bg-amber-100 text-amber-700' :
                          student.rank === 2 ? 'bg-gray-100 text-gray-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          #{student.rank}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">Class {student.class}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{student.percentage}%</p>
                        <p className="text-xs text-gray-500">GPA {student.gpa}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Performance */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" /> Subject Performance
                </h3>
                <div className="space-y-4">
                  {mockSubjectStats.map((subject) => (
                    <div key={subject.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-900">{subject.avg}%</span>
                          {subject.trend === 'up' ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${subject.avg >= 80 ? 'bg-green-500' : subject.avg >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${subject.avg}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* ✅ Create Exam Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Create New Examination</h2>
                <p className="text-blue-100 text-sm mt-1">Set up exam details, subjects, and schedules.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name</label>
                  <input type="text" placeholder="e.g., 1st Terminal Examination 2081" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                  <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option>Unit Test</option>
                    <option>1st Terminal</option>
                    <option>Mid-Term</option>
                    <option>2nd Terminal</option>
                    <option>Final Examination</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option>2081 B.S.</option>
                    <option>2080 B.S.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              {/* Subjects & Marks Configuration */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Subjects & Marks</h3>
                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">+ Add Subject</button>
                </div>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="px-4 py-2 text-left">Subject</th>
                        <th className="px-4 py-2 text-center">Theory</th>
                        <th className="px-4 py-2 text-center">Practical</th>
                        <th className="px-4 py-2 text-center">Pass</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-2"><input type="text" defaultValue="Mathematics" className="w-full bg-transparent focus:outline-none" /></td>
                        <td className="px-4 py-2"><input type="number" defaultValue="75" className="w-full text-center bg-transparent focus:outline-none" /></td>
                        <td className="px-4 py-2"><input type="number" defaultValue="25" className="w-full text-center bg-transparent focus:outline-none" /></td>
                        <td className="px-4 py-2"><input type="number" defaultValue="40" className="w-full text-center bg-transparent focus:outline-none" /></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2"><input type="text" defaultValue="Science" className="w-full bg-transparent focus:outline-none" /></td>
                        <td className="px-4 py-2"><input type="number" defaultValue="75" className="w-full text-center bg-transparent focus:outline-none" /></td>
                        <td className="px-4 py-2"><input type="number" defaultValue="25" className="w-full text-center bg-transparent focus:outline-none" /></td>
                        <td className="px-4 py-2"><input type="number" defaultValue="40" className="w-full text-center bg-transparent focus:outline-none" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 border border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Require Principal Approval</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Lock results after submission</span>
                </label>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsCreateModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Cancel</button>
              <button className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Create Exam & Setup Routine</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}