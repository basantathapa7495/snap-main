'use client';

import { useState } from 'react';
import { 
  Plus, FileText, Search, Filter, Eye, Edit3, CheckCircle, 
  Clock, X, Save, Users, TrendingUp, AlertCircle, ChevronRight,
  Calendar, BookOpen, Download, Upload, MessageSquare
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Mock Data ---
const stats = {
  active: 3,
  submissionsToday: 12,
  overdue: 5,
  total: 8
};

const mockAssignments = [
  { 
    id: 1, 
    title: 'Algebra — Quadratic Equations', 
    class: 'Grade 10A', 
    subject: 'Mathematics',
    dueDate: '22 Bhadra', 
    maxMarks: 20, 
    submitted: 28, 
    total: 42, 
    status: 'Active',
    description: 'Solve exercises 5.1 to 5.3 from the textbook. Show all working steps.',
    createdAt: '18 Bhadra'
  },
  { 
    id: 2, 
    title: 'Geometry — Triangles', 
    class: 'Grade 10B', 
    subject: 'Mathematics',
    dueDate: '20 Bhadra', 
    maxMarks: 25, 
    submitted: 35, 
    total: 40, 
    status: 'Due Soon',
    description: 'Complete the worksheet on triangle congruence and similarity.',
    createdAt: '15 Bhadra'
  },
  { 
    id: 3, 
    title: 'Homework — Chapter 4', 
    class: 'Grade 9A', 
    subject: 'Mathematics',
    dueDate: '18 Bhadra', 
    maxMarks: 15, 
    submitted: 40, 
    total: 45, 
    status: 'Closed',
    description: 'Review chapter 4 and answer the review questions at the end.',
    createdAt: '12 Bhadra'
  },
  { 
    id: 4, 
    title: 'Practice Set — Integers', 
    class: 'Grade 9B', 
    subject: 'Mathematics',
    dueDate: '25 Bhadra', 
    maxMarks: 20, 
    submitted: 10, 
    total: 43, 
    status: 'Active',
    description: 'Practice integer operations including addition, subtraction, multiplication and division.',
    createdAt: '20 Bhadra'
  },
  { 
    id: 5, 
    title: 'Project — Real-life Math', 
    class: 'Grade 10A', 
    subject: 'Mathematics',
    dueDate: '30 Bhadra', 
    maxMarks: 50, 
    submitted: 5, 
    total: 42, 
    status: 'Active',
    description: 'Create a project demonstrating how mathematics is used in daily life.',
    createdAt: '22 Bhadra'
  },
  { 
    id: 6, 
    title: 'Worksheet — Fractions', 
    class: 'Grade 9A', 
    subject: 'Mathematics',
    dueDate: '15 Bhadra', 
    maxMarks: 10, 
    submitted: 45, 
    total: 45, 
    status: 'Closed',
    description: 'Complete the fractions worksheet provided in class.',
    createdAt: '10 Bhadra'
  },
];

const mockSubmissions = [
  { id: 's1', name: 'Aarav Sharma', rollNo: 1, submittedAt: '20 Bhadra, 2:30 PM', status: 'Graded', score: 18, maxMarks: 20, feedback: 'Excellent work!' },
  { id: 's2', name: 'Vivaan Singh', rollNo: 2, submittedAt: '20 Bhadra, 3:15 PM', status: 'Graded', score: 16, maxMarks: 20, feedback: 'Good, but check Q3' },
  { id: 's3', name: 'Aditya Verma', rollNo: 3, submittedAt: '21 Bhadra, 9:00 AM', status: 'Pending', score: null, maxMarks: 20, feedback: '' },
  { id: 's4', name: 'Sai Patel', rollNo: 4, submittedAt: '21 Bhadra, 10:30 AM', status: 'Pending', score: null, maxMarks: 20, feedback: '' },
  { id: 's5', name: 'Arjun Reddy', rollNo: 5, submittedAt: '19 Bhadra, 4:00 PM', status: 'Graded', score: 19, maxMarks: 20, feedback: 'Perfect!' },
  { id: 's6', name: 'Reyansh Kumar', rollNo: 6, submittedAt: null, status: 'Not Submitted', score: null, maxMarks: 20, feedback: '' },
];

type Assignment = typeof mockAssignments[0];

export default function TeacherAssignmentsPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'due-soon' | 'closed'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssignments = mockAssignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.class.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || a.status.toLowerCase().replace(' ', '-') === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'Active') return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200"><div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div> Active</span>;
    if (status === 'Due Soon') return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200"><Clock className="h-3 w-3" /> Due Soon</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 border border-gray-200"><CheckCircle className="h-3 w-3" /> Closed</span>;
  };

  const getSubmissionBadge = (status: string) => {
    if (status === 'Graded') return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 border border-green-200">Graded</span>;
    if (status === 'Pending') return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">Pending</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 border border-red-200">Not Submitted</span>;
  };

  const handleOpenView = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsViewModalOpen(true);
  };

  const handleOpenGrade = (submission: any) => {
    setSelectedSubmission(submission);
    setIsGradeModalOpen(true);
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Assignments</h1>
              <p className="mt-1.5 text-sm text-gray-500">Create homework and track student submissions.</p>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create Assignment
            </button>
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FileText className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Active</p><p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.active}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Submissions Today</p><p className="text-2xl font-bold text-emerald-700 tabular-nums">{stats.submissionsToday}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><AlertCircle className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Overdue</p><p className="text-2xl font-bold text-red-700 tabular-nums">{stats.overdue}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><BookOpen className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Total</p><p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.total}</p></div>
              </div>
            </div>
          </div>

          {/* Filter Tabs & Search */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 border-b border-gray-200">
              {(['all', 'active', 'due-soon', 'closed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`relative px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                    activeFilter === filter ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {filter.replace('-', ' ')}
                  {activeFilter === filter && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search assignments..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
              />
            </div>
          </div>

          {/* Assignments Table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {filteredAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4"><FileText className="h-8 w-8 text-gray-400" /></div>
                <h3 className="text-lg font-semibold text-gray-900">No assignments found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium text-gray-500">Assignment</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Class</th>
                      <th className="px-6 py-4 font-medium text-gray-500 hidden md:table-cell">Due Date</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Submitted</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                      <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAssignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{assignment.title}</p>
                              <p className="text-xs text-gray-500">{assignment.subject} · Max: {assignment.maxMarks} marks</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{assignment.class}</td>
                        <td className="px-6 py-4 hidden md:table-cell text-gray-500">{assignment.dueDate}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  assignment.submitted / assignment.total >= 0.8 ? 'bg-green-500' : 
                                  assignment.submitted / assignment.total >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                                }`} 
                                style={{ width: `${(assignment.submitted / assignment.total) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700">{assignment.submitted}/{assignment.total}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(assignment.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleOpenView(assignment)}
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

      {/* ✅ Create Assignment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Create Assignment</h2>
                <p className="text-blue-100 text-sm mt-1">Assign homework to your classes</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignment Title</label>
                <input type="text" placeholder="e.g., Algebra — Quadratic Equations" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
                  <select className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                    <option>Grade 10A</option>
                    <option>Grade 10B</option>
                    <option>Grade 9A</option>
                    <option>Grade 9B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                  <input type="date" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Marks</label>
                <input type="number" placeholder="20" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Instructions</label>
                <textarea rows={4} placeholder="Describe the assignment requirements..." className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachment (Optional)</label>
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-xs font-semibold text-gray-700">Click to upload worksheet</p>
                  <p className="text-[10px] text-gray-500 mt-1">PDF, DOC up to 5MB</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsCreateModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors">Cancel</button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" /> Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ View Assignment Modal */}
      {isViewModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)}>
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedAssignment.title}</h2>
                <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                  <Users className="h-4 w-4" /> {selectedAssignment.class} · Due: {selectedAssignment.dueDate}
                </p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Assignment Info */}
              <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <h3 className="text-sm font-bold text-blue-900 mb-2">Instructions</h3>
                <p className="text-sm text-blue-800">{selectedAssignment.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-blue-700">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Created: {selectedAssignment.createdAt}</span>
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Max Marks: {selectedAssignment.maxMarks}</span>
                </div>
              </div>

              {/* Submissions Stats */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Student Submissions</h3>
                <span className="text-xs font-bold text-blue-600">{selectedAssignment.submitted} / {selectedAssignment.total} Submitted</span>
              </div>

              {/* Submissions Table */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-500 w-16">Roll</th>
                      <th className="px-4 py-3 font-medium text-gray-500">Student</th>
                      <th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Submitted</th>
                      <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mockSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{sub.rollNo.toString().padStart(2, '0')}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{sub.name}</td>
                        <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500">{sub.submittedAt || '—'}</td>
                        <td className="px-4 py-3">{getSubmissionBadge(sub.status)}</td>
                        <td className="px-4 py-3 text-right">
                          {sub.status === 'Pending' && (
                            <button 
                              onClick={() => handleOpenGrade(sub)}
                              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-blue-700 transition-colors"
                            >
                              Grade
                            </button>
                          )}
                          {sub.status === 'Graded' && (
                            <span className="text-xs font-semibold text-green-700">{sub.score}/{sub.maxMarks}</span>
                          )}
                          {sub.status === 'Not Submitted' && (
                            <span className="text-[10px] text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsViewModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors">Close</button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Grade Submission Modal */}
      {isGradeModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsGradeModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Grade Submission</h2>
                <p className="text-emerald-100 text-sm mt-1">{selectedSubmission.name} · Roll {selectedSubmission.rollNo}</p>
              </div>
              <button onClick={() => setIsGradeModalOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Score (out of {selectedSubmission.maxMarks})</label>
                <input 
                  type="number" 
                  defaultValue={selectedSubmission.score || ''}
                  max={selectedSubmission.maxMarks}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Feedback (Optional)</label>
                <textarea 
                  rows={3} 
                  defaultValue={selectedSubmission.feedback || ''}
                  placeholder="e.g., Great work! Check your calculations in Q3."
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" 
                />
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">Feedback will be shared with the student immediately.</p>
              </div>
            </div>

            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsGradeModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors">Cancel</button>
              <button 
                onClick={() => { setIsGradeModalOpen(false); setIsViewModalOpen(false); }}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <Save className="h-4 w-4" /> Save Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}