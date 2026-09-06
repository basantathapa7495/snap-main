'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { 
  Calendar, Clock, MapPin, BookOpen, CheckCircle, AlertCircle, 
  FileText, Eye, TrendingUp, GraduationCap
} from 'lucide-react';

// --- Mock Data (Based on your reference HTML) ---
const exams = [
  { 
    id: 1, 
    title: 'Unit Test 2', 
    dateRange: '21 – 25 Bhadra 2083', 
    status: 'Upcoming',
    type: 'Test'
  },
  { 
    id: 2, 
    title: 'First Terminal Exam', 
    dateRange: '15 – 25 Ashadh 2083', 
    status: 'Completed',
    type: 'Terminal'
  },
];

const unitTest2Schedule = [
  { id: 1, date: '21 Bhadra', day: 'Monday', subject: 'Mathematics', time: '8:00 – 10:00', room: 'Room 12' },
  { id: 2, date: '22 Bhadra', day: 'Tuesday', subject: 'English', time: '8:00 – 10:00', room: 'Room 12' },
  { id: 3, date: '23 Bhadra', day: 'Wednesday', subject: 'Science', time: '8:00 – 10:00', room: 'Lab 1' },
  { id: 4, date: '24 Bhadra', day: 'Thursday', subject: 'Nepali', time: '8:00 – 10:00', room: 'Room 12' },
  { id: 5, date: '25 Bhadra', day: 'Friday', subject: 'Social Studies', time: '8:00 – 10:00', room: 'Room 12' },
];

export default function StudentExamsPage() {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState(1);

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

  const getStatusBadge = (status: string) => {
    if (status === 'Upcoming') return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200"><Clock className="h-3 w-3" /> Upcoming</span>;
    if (status === 'Completed') return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200"><CheckCircle className="h-3 w-3" /> Completed</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200"><Calendar className="h-3 w-3" /> Ongoing</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Exams</h1>
            <p className="mt-1.5 text-sm text-gray-500">Upcoming and past examinations.</p>
          </div>

          {/* Exam Overview Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {exams.map((exam) => (
              <div 
                key={exam.id} 
                onClick={() => setSelectedExamId(exam.id)}
                className={`rounded-2xl border p-6 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                  selectedExamId === exam.id ? 'border-blue-200 bg-blue-50/30 ring-2 ring-blue-100' : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  {getStatusBadge(exam.status)}
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-1">{exam.title}</h3>
                <p className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> {exam.dateRange}
                </p>
                
                <button className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  exam.status === 'Upcoming' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200' 
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}>
                  <Eye className="h-4 w-4" /> 
                  {exam.status === 'Upcoming' ? 'View Schedule' : 'View Results'}
                </button>
              </div>
            ))}
          </div>

          {/* Exam Schedule Section */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" /> Unit Test 2 Schedule
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Grade 10A · Academic Year 2083</p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                <Calendar className="h-3.5 w-3.5" /> Add to Calendar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-500">Date</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Subject</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Time</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {unitTest2Schedule.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{item.date}</p>
                        <p className="text-xs text-gray-500">{item.day}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-gray-900">{item.subject}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                          <Clock className="h-3.5 w-3.5 text-gray-400" /> {item.time}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" /> {item.room}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exam Instructions / Tips */}
          <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
            <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Important Exam Instructions
            </h4>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                Students must arrive at the exam hall at least 15 minutes before the scheduled time.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                Bring your own geometry box, calculator (if permitted), and admit card.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                Mobile phones and smartwatches are strictly prohibited inside the examination hall.
              </li>
            </ul>
          </div>

        </main>
      </div>
    </div>
  );
}