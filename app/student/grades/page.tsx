'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { 
  Award, TrendingUp, Users, CheckCircle, Download, 
  FileText, BookOpen, GraduationCap
} from 'lucide-react';

// --- Mock Data (Based on your reference HTML) ---
const summaryStats = {
  average: 78,
  grade: 'B+',
  gpa: 3.2,
  rank: 8,
  totalStudents: 42,
  result: 'Pass'
};

const recentResults = [
  { id: 1, exam: 'Unit Test 2', subject: 'Mathematics', marks: 42, max: 50, percent: 84, grade: 'A' },
  { id: 2, exam: 'Unit Test 2', subject: 'English', marks: 41, max: 50, percent: 82, grade: 'A' },
  { id: 3, exam: 'Unit Test 2', subject: 'Science', marks: 35, max: 50, percent: 70, grade: 'B+' },
  { id: 4, exam: 'Unit Test 1', subject: 'Mathematics', marks: 38, max: 50, percent: 76, grade: 'B+' },
  { id: 5, exam: 'Unit Test 1', subject: 'Nepali', marks: 43, max: 50, percent: 86, grade: 'A' },
  { id: 6, exam: 'Mid-Term', subject: 'All Subjects', marks: 0, max: 0, percent: 76, grade: 'B+' },
];

const reportCards = [
  {
    term: 'First Terminal Report Card',
    year: 'Academic Year 2083',
    class: 'Grade 10A',
    overallPercent: 78,
    overallGpa: 3.2,
    result: 'Pass',
    subjects: [
      { name: 'Mathematics', theory: 68, practical: 0, total: 68, grade: 'B+', gpa: 3.2 },
      { name: 'English', theory: 74, practical: 0, total: 74, grade: 'A', gpa: 3.6 },
      { name: 'Science', theory: 62, practical: 18, total: 80, grade: 'A', gpa: 3.6 },
      { name: 'Nepali', theory: 78, practical: 0, total: 78, grade: 'A', gpa: 3.6 },
      { name: 'Social Studies', theory: 70, practical: 0, total: 70, grade: 'B+', gpa: 3.2 },
      { name: 'Optional Math', theory: 72, practical: 0, total: 72, grade: 'A', gpa: 3.6 },
    ]
  }
];

export default function StudentGradesPage() {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const getGradeColor = (grade: string) => {
    if (grade === 'A' || grade === 'A+') return 'bg-green-50 text-green-700 border-green-200';
    if (grade === 'B+' || grade === 'B') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (grade === 'C+' || grade === 'C') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Grades & Results</h1>
            <p className="mt-1.5 text-sm text-gray-500">Your academic performance and report cards.</p>
          </div>

          {/* Summary Stats */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><TrendingUp className="h-5 w-5" /></div>
                <p className="text-sm font-medium text-gray-500">Overall Average</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{summaryStats.average}%</p>
              <p className="mt-1 text-xs text-gray-500">Grade: <span className="font-bold text-gray-900">{summaryStats.grade}</span></p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><Award className="h-5 w-5" /></div>
                <p className="text-sm font-medium text-gray-500">GPA</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{summaryStats.gpa}</p>
              <p className="mt-1 text-xs text-gray-500">Out of 4.0</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Users className="h-5 w-5" /></div>
                <p className="text-sm font-medium text-gray-500">Rank in Class</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{summaryStats.rank} <span className="text-lg font-normal text-gray-400">/ {summaryStats.totalStudents}</span></p>
              <p className="mt-1 text-xs text-gray-500">Top {Math.round((summaryStats.rank / summaryStats.totalStudents) * 100)}%</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600"><CheckCircle className="h-5 w-5" /></div>
                <p className="text-sm font-medium text-gray-500">Result</p>
              </div>
              <p className="text-3xl font-bold text-green-600 tabular-nums">{summaryStats.result}</p>
              <p className="mt-1 text-xs text-gray-500">Academic Year 2083</p>
            </div>
          </div>

          {/* Recent Results Table */}
          <div className="mb-8 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" /> Recent Results
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-500">Exam / Test</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Subject</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Marks</th>
                    <th className="px-6 py-4 font-medium text-gray-500">%</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentResults.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{res.exam}</td>
                      <td className="px-6 py-4 text-gray-700">{res.subject}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900 tabular-nums">
                        {res.subject === 'All Subjects' ? '—' : `${res.marks}`} 
                        <span className="text-gray-400 font-normal"> / {res.max}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 tabular-nums">{res.percent}%</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${getGradeColor(res.grade)}`}>
                          {res.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Terminal Report Cards */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Terminal Report Cards</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {reportCards.map((card, index) => (
                <div key={index} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{card.term}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{card.year} · {card.class}</p>
                    </div>
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors">
                      <Download className="h-4 w-4" /> Download PDF
                    </button>
                  </div>

                  {/* Subjects Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3 font-medium text-gray-500">Subject</th>
                          <th className="px-6 py-3 font-medium text-gray-500 text-center">Theory</th>
                          <th className="px-6 py-3 font-medium text-gray-500 text-center">Practical</th>
                          <th className="px-6 py-3 font-medium text-gray-500 text-center">Total</th>
                          <th className="px-6 py-3 font-medium text-gray-500 text-center">Grade</th>
                          <th className="px-6 py-3 font-medium text-gray-500 text-center">GPA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {card.subjects.map((sub, subIdx) => (
                          <tr key={subIdx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-3 font-medium text-gray-900">{sub.name}</td>
                            <td className="px-6 py-3 text-center text-gray-700 tabular-nums">{sub.theory}</td>
                            <td className="px-6 py-3 text-center text-gray-700 tabular-nums">{sub.practical || '—'}</td>
                            <td className="px-6 py-3 text-center font-bold text-gray-900 tabular-nums">{sub.total}</td>
                            <td className="px-6 py-3 text-center">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${getGradeColor(sub.grade)}`}>
                                {sub.grade}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-center font-bold text-gray-900 tabular-nums">{sub.gpa}</td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Footer Summary */}
                      <tfoot className="bg-blue-50/50 border-t-2 border-blue-100">
                        <tr>
                          <td colSpan={3} className="px-6 py-3 text-sm font-bold text-gray-900">Overall Summary</td>
                          <td className="px-6 py-3 text-center font-bold text-gray-900 tabular-nums">{card.overallPercent}%</td>
                          <td className="px-6 py-3 text-center font-bold text-gray-900">—</td>
                          <td className="px-6 py-3 text-center font-bold text-gray-900 tabular-nums">{card.overallGpa}</td>
                        </tr>
                        <tr>
                          <td colSpan={6} className="px-6 py-3 text-sm font-bold text-green-700 text-center bg-green-50/50">
                            Result: {card.result}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}