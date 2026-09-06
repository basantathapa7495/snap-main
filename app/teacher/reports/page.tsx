'use client';

import { useState } from 'react';
import { 
  FileText, FileSpreadsheet, Download, Users, TrendingUp, 
  Calendar, Filter, BarChart3, AlertCircle, CheckCircle
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Mock Data ---
const classReports = [
  { id: 1, class: 'Grade 10A', subject: 'Mathematics', students: 42, avgScore: 76, passRate: 95, trend: '+2%' },
  { id: 2, class: 'Grade 10B', subject: 'Mathematics', students: 40, avgScore: 71, passRate: 88, trend: '-1%' },
  { id: 3, class: 'Grade 9A', subject: 'Mathematics', students: 45, avgScore: 78, passRate: 97, trend: '+4%' },
  { id: 4, class: 'Grade 9B', subject: 'Mathematics', students: 43, avgScore: 74, passRate: 91, trend: '0%' },
];

const attendanceReports = [
  { id: 1, title: 'Monthly Attendance Summary', description: 'Overall attendance stats for all my classes', period: 'Bhadra 2083', type: 'Excel', count: '4 Classes' },
  { id: 2, title: 'Low Attendance Students', description: 'List of students with less than 75% attendance', period: 'Current Month', type: 'PDF', count: '8 Students' },
  { id: 3, title: 'Class-wise Attendance Trend', description: 'Day-by-day attendance comparison across sections', period: 'Last 30 Days', type: 'Excel', count: 'Visual Chart' },
];

export default function TeacherReportsPage() {
  const [selectedTerm, setSelectedTerm] = useState('First Terminal');

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">My Reports</h1>
              <p className="mt-1.5 text-sm text-gray-500">Class performance and attendance reports for your subjects.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select 
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-8 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option>First Terminal</option>
                  <option>Second Terminal</option>
                  <option>Final Examination</option>
                  <option>Monthly - Bhadra</option>
                </select>
              </div>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" /> Export All
              </button>
            </div>
          </div>

          {/* Section 1: Class Performance Reports */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Class Performance</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {classReports.map((report) => (
                <div key={report.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{report.class}</h3>
                      <p className="text-sm text-gray-500">{report.subject} · {report.students} students</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      report.trend.startsWith('+') ? 'bg-green-50 text-green-700 border border-green-200' : 
                      report.trend.startsWith('-') ? 'bg-red-50 text-red-700 border border-red-200' : 
                      'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}>
                      <TrendingUp className={`h-3 w-3 ${report.trend.startsWith('-') ? 'rotate-180' : ''}`} /> {report.trend}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Avg. Score</p>
                      <p className="text-xl font-bold text-gray-900">{report.avgScore}%</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Pass Rate</p>
                      <p className="text-xl font-bold text-gray-900">{report.passRate}%</p>
                    </div>
                  </div>

                  <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <FileText className="h-4 w-4 text-red-500" /> View PDF Report
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Attendance Reports */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">Attendance Reports</h2>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {attendanceReports.map((report) => (
                  <div key={report.id} className="p-5 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 ${
                        report.type === 'Excel' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {report.type === 'Excel' ? <FileSpreadsheet className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-gray-900">{report.title}</h4>
                        <p className="text-sm text-gray-500 mt-0.5">{report.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                            <Calendar className="h-3 w-3" /> {report.period}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                            <Users className="h-3 w-3" /> {report.count}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${
                      report.type === 'Excel' 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}>
                      {report.type === 'Excel' ? <FileSpreadsheet className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      View {report.type}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}