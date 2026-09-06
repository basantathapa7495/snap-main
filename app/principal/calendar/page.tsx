'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, 
  MapPin, Users, X, Tag, FileText, GraduationCap, Trophy, Coffee
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Mock Data ---
const eventTypes = {
  exam: { label: 'Exam', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  holiday: { label: 'Holiday', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  meeting: { label: 'Meeting', color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  sports: { label: 'Sports', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  event: { label: 'Event', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
};

const mockEvents = [
  { id: 1, title: '1st Terminal Exam Begins', date: '2023-10-15', time: '07:00 AM', type: 'exam', location: 'All Classrooms', audience: 'All Students' },
  { id: 2, title: 'Parent-Teacher Meeting', date: '2023-10-22', time: '10:00 AM', type: 'meeting', location: 'Main Hall', audience: 'Parents & Teachers' },
  { id: 3, title: 'Dashain Holiday Starts', date: '2023-10-24', time: 'All Day', type: 'holiday', location: 'School Closed', audience: 'Entire School' },
  { id: 4, title: 'Inter-House Football Final', date: '2023-10-28', time: '02:00 PM', type: 'sports', location: 'School Ground', audience: 'All Students' },
  { id: 5, title: 'Science Fair Exhibition', date: '2023-10-12', time: '09:00 AM', type: 'event', location: 'Science Block', audience: 'Class 9 & 10' },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  
  const calendarDays = useMemo(() => {
    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, date: null });
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayEvents = mockEvents.filter(e => e.date === dateStr);
      days.push({ day: i, date: dateStr, events: dayEvents });
    }
    return days;
  }, [year, month]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const isToday = (day: number | null) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">School Calendar</h1>
              <p className="mt-1.5 text-sm text-gray-500">Manage exams, holidays, events, and meetings.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create Event
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            
            {/* Left: Main Calendar Grid (3/4 width) */}
            <div className="lg:col-span-3 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
              
              {/* Calendar Controls */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-900">{monthNames[month]} {year}</h2>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1">
                    <button className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-md">Month</button>
                    <button className="px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-md">Week</button>
                    <button className="px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-md">Day</button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={goToToday} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">Today</button>
                  <button onClick={goToPrevMonth} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={goToNextMonth} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/30">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-100 gap-px border-b border-gray-100">
                {calendarDays.map((slot, idx) => (
                  <div 
                    key={idx} 
                    className={`min-h-[100px] bg-white p-2 transition-colors hover:bg-blue-50/30 ${!slot.day ? 'bg-gray-50/50' : ''}`}
                  >
                    {slot.day && (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            isToday(slot.day) ? 'bg-blue-600 text-white' : 'text-gray-700'
                          }`}>
                            {slot.day}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {slot.events.map(event => (
                            <button 
                              key={event.id} 
                              onClick={() => setSelectedEvent(event)}
                              className={`w-full text-left rounded-md px-1.5 py-0.5 text-[10px] font-medium truncate border ${eventTypes[event.type as keyof typeof eventTypes].color} hover:opacity-80 transition-opacity`}
                            >
                              {event.title}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Upcoming Agenda (1/4 width) */}
            <div className="space-y-6">
              
              {/* Legend */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Event Types</h3>
                <div className="space-y-2">
                  {Object.entries(eventTypes).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${val.dot}`}></div>
                      <span className="text-xs font-medium text-gray-600">{val.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Events List */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" /> Upcoming Agenda
                </h3>
                <div className="space-y-4">
                  {mockEvents.slice(0, 4).map(event => (
                    <div key={event.id} className="group cursor-pointer" onClick={() => setSelectedEvent(event)}>
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="text-[10px] font-bold text-gray-400 uppercase">
                            {new Date(event.date).toLocaleString('default', { month: 'short' })}
                          </div>
                          <div className="text-lg font-bold text-gray-900 leading-none">
                            {new Date(event.date).getDate()}
                          </div>
                        </div>
                        <div className="flex-1 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold border ${eventTypes[event.type as keyof typeof eventTypes].color}`}>
                              {eventTypes[event.type as keyof typeof eventTypes].label}
                            </span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" /> {event.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* ✅ Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Create New Event</h2>
                <p className="text-blue-100 text-sm mt-1">Add to the school calendar.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input type="text" placeholder="e.g., Annual Sports Day" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                    <option value="exam">📝 Exam</option>
                    <option value="holiday"> Holiday</option>
                    <option value="meeting">🤝 Meeting</option>
                    <option value="sports">🏆 Sports</option>
                    <option value="event">🎉 General Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                  <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                    <option>Entire School</option>
                    <option>Teachers Only</option>
                    <option>Specific Class</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="e.g., Main Hall" className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} placeholder="Add details about the event..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"></textarea>
              </div>
            </div>

            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Cancel</button>
              <button className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Save Event</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Event Detail Modal (When clicking an event) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 text-white ${eventTypes[selectedEvent.type as keyof typeof eventTypes].color.replace('text-', 'bg-').replace('100', '600').replace('border-', '')}`}>
               {/* Hacky color mapping for demo, in real app use a map */}
               <div className="flex items-start justify-between">
                 <div>
                   <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm mb-2">
                     {eventTypes[selectedEvent.type as keyof typeof eventTypes].label}
                   </span>
                   <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
                 </div>
                 <button onClick={() => setSelectedEvent(null)} className="rounded-full bg-black/20 p-1.5 text-white hover:bg-black/30">
                   <X className="h-4 w-4" />
                 </button>
               </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CalIcon className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{selectedEvent.date} • {selectedEvent.time}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{selectedEvent.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{selectedEvent.audience}</span>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Description</p>
                <p className="text-sm text-gray-600">
                  This is a placeholder description for the event. In the real app, this would contain all the details entered by the principal.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 rounded-lg border border-gray-200 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Edit</button>
                <button className="flex-1 rounded-lg bg-red-50 border border-red-100 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}