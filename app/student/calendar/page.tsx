'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { 
  Calendar, ChevronLeft, ChevronRight, GraduationCap, 
  Palmtree, PartyPopper, Wallet, Clock
} from 'lucide-react';

// --- Mock Data (Based on your reference HTML) ---
const currentMonth = {
  name: 'Bhadra',
  year: '2083',
  englishMonth: 'August 2026',
  daysInMonth: 32, // Bhadra usually has 31 or 32 days
  startDayOffset: 2 // 0=Sun, 1=Mon, 2=Tue (Starts on Tuesday for this mock)
};

// Map events to specific dates
const eventsMap: Record<number, { type: 'Exam' | 'Holiday' | 'Event' | 'Fee Due'; title: string }[]> = {
  5: [{ type: 'Exam', title: 'Unit Test 2 (Math)' }],
  10: [{ type: 'Holiday', title: 'Teej' }],
  15: [{ type: 'Fee Due', title: 'Monthly Fee' }],
  21: [{ type: 'Exam', title: 'Unit Test 2 Starts' }],
  23: [{ type: 'Event', title: 'Parent-Teacher Meeting' }],
  25: [{ type: 'Exam', title: 'Unit Test 2 Ends' }],
  28: [{ type: 'Holiday', title: 'Gai Jatra' }],
};

const upcomingEvents = [
  { id: 1, date: '21 Bhadra', title: 'Unit Test 2 Begins', type: 'Exam', time: '8:00 AM' },
  { id: 2, date: '23 Bhadra', title: 'Parent-Teacher Meeting', type: 'Event', time: '10:00 AM' },
  { id: 3, date: '25 Bhadra', title: 'Next Fee Installment', type: 'Fee Due', time: 'All Day' },
];

export default function StudentCalendarPage() {
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
        
        // TODO: Fetch real events from database
        // const { data: events } = await supabase.from('news_events').select('*').eq('school_id', profileData.school_id);
      }
      setLoading(false);
    }
    getData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  if (!user) return <div className="flex h-screen items-center justify-center bg-gray-50"><p className="text-gray-500">Please log in.</p></div>;

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < currentMonth.startDayOffset; i++) {
    calendarDays.push({ day: null, events: [] });
  }
  for (let i = 1; i <= currentMonth.daysInMonth; i++) {
    calendarDays.push({ day: i, events: eventsMap[i] || [] });
  }

  const getEventStyles = (type: string) => {
    if (type === 'Exam') return 'bg-red-100 text-red-700 border-red-200';
    if (type === 'Holiday') return 'bg-green-100 text-green-700 border-green-200';
    if (type === 'Event') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (type === 'Fee Due') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getEventIcon = (type: string) => {
    if (type === 'Exam') return <GraduationCap className="h-3 w-3" />;
    if (type === 'Holiday') return <Palmtree className="h-3 w-3" />;
    if (type === 'Event') return <PartyPopper className="h-3 w-3" />;
    if (type === 'Fee Due') return <Wallet className="h-3 w-3" />;
    return null;
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Calendar</h1>
              <p className="mt-1.5 text-sm text-gray-500">Exams, holidays and important dates.</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              <button className="rounded-md p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm font-semibold text-gray-900">
                {currentMonth.name} {currentMonth.year} · {currentMonth.englishMonth}
              </span>
              <button className="rounded-md p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500"></div> Exam
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-green-500"></div> Holiday
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div> Event
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-amber-500"></div> Fee Due
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Calendar Grid (2/3 width) */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              {/* Days of Week Header */}
              <div className="mb-4 grid grid-cols-7 gap-2 text-center">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((cell, index) => (
                  <div 
                    key={index} 
                    className={`min-h-[80px] rounded-xl border p-2 transition-colors ${
                      cell.day === null 
                        ? 'border-transparent bg-transparent' 
                        : cell.day === 21 // Mocking today as 21st
                          ? 'border-blue-200 bg-blue-50/50 ring-2 ring-blue-100'
                          : 'border-gray-100 bg-gray-50/30 hover:bg-gray-50'
                    }`}
                  >
                    {cell.day && (
                      <>
                        <div className={`mb-1 text-xs font-bold ${
                          cell.day === 21 ? 'text-blue-600' : 'text-gray-700'
                        }`}>
                          {cell.day}
                        </div>
                        <div className="flex flex-col gap-1">
                          {cell.events.map((event, eIdx) => (
                            <div 
                              key={eIdx} 
                              className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-tight truncate ${getEventStyles(event.type)}`}
                              title={event.title}
                            >
                              {getEventIcon(event.type)}
                              <span className="truncate">{event.title}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events List (1/3 width) */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" /> Upcoming Events
              </h3>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex gap-4 p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:shadow-sm transition-all">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${getEventStyles(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {event.date} · {event.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-6 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                View Full Academic Calendar
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}