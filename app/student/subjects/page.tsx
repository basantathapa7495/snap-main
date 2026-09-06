'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { BookOpen, User, TrendingUp, Calendar, Award, Clock } from 'lucide-react';

// Mock Data for Subjects
const mockSubjects = [
  {
    id: 1,
    name: 'Mathematics',
    teacher: 'Hari Bahadur Thapa',
    progress: 78,
    lastTestScore: 42,
    maxMarks: 50,
    attendance: 96,
    color: 'blue'
  },
  {
    id: 2,
    name: 'English',
    teacher: 'Sunita Devi Sharma',
    progress: 82,
    lastTestScore: 41,
    maxMarks: 50,
    attendance: 98,
    color: 'purple'
  },
  {
    id: 3,
    name: 'Science',
    teacher: 'Ram Prasad Adhikari',
    progress: 71,
    lastTestScore: 35,
    maxMarks: 50,
    attendance: 94,
    color: 'emerald'
  },
  {
    id: 4,
    name: 'Nepali',
    teacher: 'Gita Kumari Poudel',
    progress: 85,
    lastTestScore: 43,
    maxMarks: 50,
    attendance: 97,
    color: 'amber'
  },
  {
    id: 5,
    name: 'Social Studies',
    teacher: 'Krishna Raj Magar',
    progress: 76,
    lastTestScore: 38,
    maxMarks: 50,
    attendance: 95,
    color: 'cyan'
  },
  {
    id: 6,
    name: 'Optional Mathematics',
    teacher: 'Hari Bahadur Thapa',
    progress: 80,
    lastTestScore: 40,
    maxMarks: 50,
    attendance: 96,
    color: 'pink'
  },
];

export default function StudentSubjectsPage() {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState(mockSubjects);

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) { setLoading(false); return; }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);

      if (profileData?.school_id) {
        const { data: schoolData } = await supabase
          .from('schools')
          .select('name')
          .eq('id', profileData.school_id)
          .single();
        setSchool(schoolData);

        // TODO: Fetch real subjects from database
        // const { data: subjectsData } = await supabase
        //   .from('subjects')
        //   .select('*')
        //   .eq('student_id', user.id);
        // setSubjects(subjectsData || []);
      }
      setLoading(false);
    }
    getData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  if (!user) return <div className="flex h-screen items-center justify-center bg-gray-50"><p className="text-gray-500">Please log in.</p></div>;

  const getColorStyles = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      purple: 'bg-purple-50 border-purple-200 text-purple-900',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      amber: 'bg-amber-50 border-amber-200 text-amber-900',
      cyan: 'bg-cyan-50 border-cyan-200 text-cyan-900',
      pink: 'bg-pink-50 border-pink-200 text-pink-900',
    };
    return colors[color] || colors.blue;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">My Subjects</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              {profile?.class || 'Grade 10A'} · Academic Year 2083
            </p>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {subjects.map((subject) => (
              <div 
                key={subject.id} 
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Subject Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${getColorStyles(subject.color)}`}>
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{subject.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> {subject.teacher}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500">Overall Progress</p>
                    <p className="text-sm font-bold text-gray-900">{subject.progress}%</p>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(subject.progress)}`} 
                      style={{ width: `${subject.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-3.5 w-3.5 text-gray-400" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Last Test</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {subject.lastTestScore}<span className="text-sm text-gray-400 font-normal">/{subject.maxMarks}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {Math.round((subject.lastTestScore / subject.maxMarks) * 100)}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Attendance</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{subject.attendance}%</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {subject.attendance >= 90 ? 'Excellent' : subject.attendance >= 75 ? 'Good' : 'Needs Improvement'}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Next class: Today</span>
                  </div>
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    View Details <TrendingUp className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Overall Performance Summary</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{subjects.length}</p>
                <p className="text-xs text-gray-500 mt-1">Total Subjects</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">
                  {Math.round(subjects.reduce((acc, s) => acc + s.progress, 0) / subjects.length)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Average Progress</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round(subjects.reduce((acc, s) => acc + s.attendance, 0) / subjects.length)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Avg. Attendance</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {subjects.filter(s => s.progress >= 80).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Excellent Subjects</p>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}