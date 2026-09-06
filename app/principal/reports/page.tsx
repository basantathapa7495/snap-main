'use client';

import { useState } from 'react';
import { 
  FileText, FileSpreadsheet, Eye, Download, Users, Wallet, 
  GraduationCap, BookOpen, TrendingUp, Calendar, CheckCircle, 
  AlertCircle, Clock, BarChart3, PieChart, Activity
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Report Categories & Items ---
const reportSections = [
  {
    id: 'student',
    title: 'Student Reports',
    icon: Users,
    color: 'text-blue-600 bg-blue-50',
    reports: [
      { id: 's1', name: 'Student List', desc: 'Complete directory of all enrolled students', icon: Users },
      { id: 's2', name: 'Enrollment Trends', desc: 'Monthly new admissions and dropouts', icon: TrendingUp },
      { id: 's3', name: 'Attendance Report', desc: 'Daily, monthly, and yearly attendance logs', icon: Calendar },
      { id: 's4', name: 'Student Performance', desc: 'Academic grades and GPA analysis', icon: BarChart3 },
    ]
  },
  {
    id: 'finance',
    title: 'Finance Reports',
    icon: Wallet,
    color: 'text-emerald-600 bg-emerald-50',
    reports: [
      { id: 'f1', name: 'Fee Collection', desc: 'Total fees collected this month/year', icon: CheckCircle },
      { id: 'f2', name: 'Pending Fees', desc: 'Students with upcoming fee deadlines', icon: Clock },
      { id: 'f3', name: 'Overdue Fees', desc: 'List of students with unpaid past dues', icon: AlertCircle },
    ]
  },
  {
    id: 'teacher',
    title: 'Teacher Reports',
    icon: GraduationCap,
    color: 'text-purple-600 bg-purple-50',
    reports: [
      { id: 't1', name: 'Teacher Attendance', desc: 'Staff presence and leave records', icon: Calendar },
      { id: 't2', name: 'Teacher Performance', desc: 'Class results and evaluation metrics', icon: Activity },
    ]
  },
  {
    id: 'academic',
    title: 'Academic & School',
    icon: BookOpen,
    color: 'text-amber-600 bg-amber-50',
    reports: [
      { id: 'a1', name: 'Exam Results', desc: 'Detailed breakdown of all examinations', icon: FileText },
      { id: 'a2', name: 'Class Performance', desc: 'Average scores per class and section', icon: PieChart },
      { id: 'a3', name: 'Pass Rate Analysis', desc: 'Subject-wise and overall pass percentages', icon: TrendingUp },
      { id: 'a4', name: 'Overall School Performance', desc: 'Comprehensive annual school health report', icon: BarChart3 },
    ]
  }
];

export default function ReportsPage() {
  const [activeSection, setActiveSection] = useState('all');

  const filteredSections = activeSection === 'all' 
    ? reportSections 
    : reportSections.filter(s => s.id === activeSection);

  const handleAction = (reportName: string, type: string) => {
    alert(`Generating ${type} for: ${reportName}\n\n(In a real app, this would trigger a server-side PDF/Excel generation or open a preview modal.)`);
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Reports & Analytics</h1>
              <p className="mt-1.5 text-sm text-gray-500">Generate, view, and export comprehensive school data.</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" /> Export All Data
            </button>
          </div>

          {/* Category Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
            <button
              onClick={() => setActiveSection('all')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                activeSection === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              All Reports
            </button>
            {reportSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  activeSection === section.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <section.icon className="h-4 w-4" />
                {section.title}
              </button>
            ))}
          </div>

          {/* Reports Grid */}
          <div className="space-y-8">
            {filteredSections.map((section) => (
              <div key={section.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                
                {/* Section Header */}
                <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${section.color}`}>
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                    <p className="text-xs text-gray-500">{section.reports.length} reports available</p>
                  </div>
                </div>

                {/* Reports List */}
                <div className="divide-y divide-gray-100">
                  {section.reports.map((report) => (
                    <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                      
                      {/* Report Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500 flex-shrink-0">
                          <report.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">{report.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{report.desc}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 sm:ml-4">
                        <button 
                          onClick={() => handleAction(report.name, 'View')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button 
                          onClick={() => handleAction(report.name, 'PDF')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-all"
                        >
                          <FileText className="h-3.5 w-3.5" /> PDF
                        </button>
                        <button 
                          onClick={() => handleAction(report.name, 'Excel')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-all"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}