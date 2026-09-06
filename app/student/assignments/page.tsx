'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { 
  FileText, Calendar, Clock, Upload, CheckCircle, AlertCircle, 
  X, BookOpen, User, Download, Send
} from 'lucide-react';

// --- Mock Data (Based on your reference HTML) ---
const pendingAssignments = [
  { 
    id: 1, 
    title: 'Algebra — Quadratic Equations', 
    subject: 'Mathematics', 
    teacher: 'Hari B. Thapa', 
    maxMarks: 20, 
    dueDate: '22 Bhadra', 
    daysLeft: 3,
    description: 'Solve exercises 5.1 to 5.3 from the textbook. Show all working steps clearly.'
  },
  { 
    id: 2, 
    title: 'Essay: Climate Change in Nepal', 
    subject: 'English', 
    teacher: 'Sunita D. Sharma', 
    maxMarks: 25, 
    dueDate: '24 Bhadra', 
    daysLeft: 5,
    description: 'Write a 500-word essay on the impact of climate change in the Himalayan region.'
  },
];

const submittedAssignments = [
  { id: 1, title: 'Geometry — Triangles', subject: 'Math', submittedAt: '18 Bhadra', score: '18/20', status: 'Graded' },
  { id: 2, title: 'Lab Report — Acids & Bases', subject: 'Science', submittedAt: '15 Bhadra', score: '16/20', status: 'Graded' },
  { id: 3, title: 'Nepali Poetry Analysis', subject: 'Nepali', submittedAt: '12 Bhadra', score: '—', status: 'Pending Review' },
];

export default function StudentAssignmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'overdue'>('pending');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

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

  const handleOpenSubmit = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsSubmitModalOpen(true);
  };

  const getDaysLeftColor = (days: number) => {
    if (days <= 2) return 'bg-red-50 text-red-700 border-red-200';
    if (days <= 5) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-green-50 text-green-700 border-green-200';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Graded') return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200"><CheckCircle className="h-3 w-3" /> Graded</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200"><Clock className="h-3 w-3" /> Pending Review</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Assignments</h1>
            <p className="mt-1.5 text-sm text-gray-500">Homework and project submissions.</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex items-center gap-1 border-b border-gray-200">
            {(['pending', 'submitted', 'overdue'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
                {tab === 'pending' && <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{pendingAssignments.length}</span>}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
              </button>
            ))}
          </div>

          {/* Content Area */}
          {activeTab === 'pending' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {pendingAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${getDaysLeftColor(assignment.daysLeft)}`}>
                      <Clock className="h-3 w-3" /> Due in {assignment.daysLeft} days
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{assignment.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> {assignment.subject} · <User className="h-3.5 w-3.5" /> {assignment.teacher}
                  </p>
                  
                  <p className="text-sm text-gray-600 mb-6 flex-1">{assignment.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500">Max Marks: <span className="text-gray-900 font-bold">{assignment.maxMarks}</span></span>
                    <button 
                      onClick={() => handleOpenSubmit(assignment)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                    >
                      <Upload className="h-4 w-4" /> Submit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'submitted' && (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium text-gray-500">Title</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Subject</th>
                      <th className="px-6 py-4 font-medium text-gray-500 hidden md:table-cell">Submitted</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Score</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                      <th className="px-6 py-4 font-medium text-gray-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {submittedAssignments.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900">{sub.title}</td>
                        <td className="px-6 py-4 text-gray-700">{sub.subject}</td>
                        <td className="px-6 py-4 hidden md:table-cell text-gray-500">{sub.submittedAt}</td>
                        <td className="px-6 py-4 font-bold text-gray-900 tabular-nums">{sub.score}</td>
                        <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                        <td className="px-6 py-4 text-right">
                          {sub.status === 'Graded' ? (
                            <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                              <Download className="h-3.5 w-3.5" /> Feedback
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'overdue' && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 px-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 mb-4">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No overdue assignments 🎉</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-sm">
                Great job! You have submitted all your assignments on time. Keep up the good work.
              </p>
            </div>
          )}

        </main>
      </div>

      {/* ✅ Submit Assignment Modal */}
      {isSubmitModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsSubmitModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Submit Assignment</h2>
                <p className="text-blue-100 text-sm mt-1">{selectedAssignment.subject} · Max: {selectedAssignment.maxMarks} marks</p>
              </div>
              <button onClick={() => setIsSubmitModalOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Assignment Title</p>
                <p className="text-sm font-semibold text-gray-900">{selectedAssignment.title}</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> Due: {selectedAssignment.dueDate}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-colors cursor-pointer group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOCX, JPG up to 10MB</p>
                  <input type="file" className="hidden" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Comments (Optional)</label>
                <textarea 
                  rows={3} 
                  placeholder="Add a note for your teacher..."
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" 
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsSubmitModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => { setIsSubmitModalOpen(false); alert('Assignment submitted successfully!'); }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Send className="h-4 w-4" /> Submit Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}