'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, FileText, Search, Filter, Eye, Edit3, CheckCircle, 
  Clock, X, Save, Users, TrendingUp, AlertCircle, ChevronRight
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Types ---
type Student = {
  id: string;
  name: string;
  rollNo: number;
  marks: number | string;
};

// --- Mock Data ---
const pendingSessions = [
  { id: 1, title: 'Unit Test 2', subject: 'Mathematics', class: 'Grade 10B', maxMarks: 50, dueDate: '21 Bhadra', submitted: 0, total: 40 },
  { id: 2, title: 'Homework — Algebra Ch. 5', subject: 'Mathematics', class: 'Grade 9A', maxMarks: 20, dueDate: '20 Bhadra', submitted: 12, total: 45 },
];

const completedSessions = [
  { id: 3, title: 'Unit Test 1', subject: 'Mathematics', class: 'Grade 10A', date: '5 Bhadra', maxMarks: 50, avgScore: 38.2, status: 'Completed' },
  { id: 4, title: 'Mid-Term Exam', subject: 'Mathematics', class: 'Grade 9A', date: '28 Shrawan', maxMarks: 100, avgScore: 72.5, status: 'Completed' },
  { id: 5, title: 'Homework — Geometry', subject: 'Mathematics', class: 'Grade 10B', date: '12 Bhadra', maxMarks: 20, avgScore: 16.8, status: 'Completed' },
];

const mockStudents: Student[] = [
  { id: 's1', name: 'Aarav Sharma', rollNo: 1, marks: 42 },
  { id: 's2', name: 'Vivaan Singh', rollNo: 2, marks: 38 },
  { id: 's3', name: 'Aditya Verma', rollNo: 3, marks: 45 },
  { id: 's4', name: 'Sai Patel', rollNo: 4, marks: 31 },
  { id: 's5', name: 'Arjun Reddy', rollNo: 5, marks: 48 },
  { id: 's6', name: 'Reyansh Kumar', rollNo: 6, marks: 29 },
  { id: 's7', name: 'Krishna Iyer', rollNo: 7, marks: 40 },
  { id: 's8', name: 'Ishaan Gupta', rollNo: 8, marks: 35 },
];

export default function MarksEntryPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenModal = (session: any) => {
    setSelectedSession(session);
    // Reset marks for pending session mock
    if (session.submitted === 0) {
      setStudents(mockStudents.map(s => ({ ...s, marks: '' })));
    } else {
      setStudents(mockStudents);
    }
    setIsModalOpen(true);
  };

  const handleMarksChange = (studentId: string, value: string) => {
    // Prevent entering more than max marks
    const numVal = parseInt(value);
    if (!isNaN(numVal) && numVal > selectedSession.maxMarks) return;
    
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, marks: value } : s));
  };

  const handleSaveMarks = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsModalOpen(false);
      alert('Marks saved successfully!');
    }, 1000);
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Marks Entry</h1>
              <p className="mt-1.5 text-sm text-gray-500">Enter and manage exam & assignment scores for your classes.</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" /> New Entry Session
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex items-center gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('pending')}
              className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'pending' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Entry
              {pendingSessions.length > 0 && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {pendingSessions.length}
                </span>
              )}
              {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'completed' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Completed
              {activeTab === 'completed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
          </div>

          {/* Content Area */}
          {activeTab === 'pending' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {pendingSessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                      <Clock className="h-3 w-3" /> Due {session.dueDate}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900">{session.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{session.class} · Max Marks: {session.maxMarks}</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <span className="font-bold text-gray-900">{session.submitted}</span> / {session.total} students marked
                    </div>
                    <button 
                      onClick={() => handleOpenModal(session)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Enter Marks
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium text-gray-500">Exam / Assignment</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Class</th>
                      <th className="px-6 py-4 font-medium text-gray-500 hidden md:table-cell">Date</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Avg. Score</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                      <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {completedSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{session.title}</p>
                              <p className="text-xs text-gray-500">Max Marks: {session.maxMarks}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{session.class}</td>
                        <td className="px-6 py-4 hidden md:table-cell text-gray-500">{session.date}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{session.avgScore}</span>
                            <span className="text-xs text-gray-400">/ {session.maxMarks}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200">
                            <CheckCircle className="h-3 w-3" /> {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ✅ Enter Marks Modal */}
      {isModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedSession.title}</h2>
                <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                  <Users className="h-4 w-4" /> {selectedSession.class} · Max Marks: {selectedSession.maxMarks}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 p-3">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Enter marks out of {selectedSession.maxMarks}</span>
                </div>
                <span className="text-xs font-bold text-amber-700">
                  {students.filter(s => s.marks !== '' && s.marks !== undefined).length} / {students.length} Marked
                </span>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-500 w-16">Roll</th>
                      <th className="px-4 py-3 font-medium text-gray-500">Student Name</th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-right w-32">Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{student.rollNo.toString().padStart(2, '0')}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            value={student.marks}
                            onChange={(e) => handleMarksChange(student.id, e.target.value)}
                            placeholder="-"
                            className="w-20 rounded-lg border border-gray-200 px-3 py-1.5 text-right text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveMarks}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Marks
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}