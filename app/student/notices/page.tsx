'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { 
  Megaphone, Calendar, FileText, Users, Bell, 
  CheckCircle, Mail, Search
} from 'lucide-react';

// --- Mock Data (Based on your reference HTML) ---
const mockNotices = [
  { 
    id: 1, 
    title: 'Parent-teacher meeting this Saturday', 
    from: 'Principal', 
    audience: 'Parents & Students', 
    date: '2 days ago', 
    isNew: true, 
    type: 'meeting',
    content: 'All parents are requested to attend the parent-teacher meeting on Saturday, 23 Bhadra from 10 AM to 1 PM in the school auditorium. Your presence is highly appreciated.'
  },
  { 
    id: 2, 
    title: 'Unit Test 2 schedule published', 
    from: 'Exam Committee', 
    audience: 'Grade 10', 
    date: '5 days ago', 
    isNew: false, 
    type: 'academic',
    content: 'Unit Test 2 will be held from 21 to 25 Bhadra. Please check the detailed schedule in the Exams section and prepare accordingly.'
  },
  { 
    id: 3, 
    title: 'School will remain closed on Friday', 
    from: 'Principal', 
    audience: 'Entire School', 
    date: '1 week ago', 
    isNew: false, 
    type: 'holiday',
    content: 'Due to local elections, the school will remain closed this Friday. Regular classes will resume on Saturday as per the normal timetable.'
  },
  { 
    id: 4, 
    title: 'Science Fair Registration Open', 
    from: 'Science Department', 
    audience: 'Grade 9 & 10', 
    date: '2 weeks ago', 
    isNew: false, 
    type: 'event',
    content: 'Students interested in participating in the annual Science Fair must register with their science teacher by 20 Bhadra. Projects can be individual or in groups of 3.'
  },
];

export default function StudentNoticesPage() {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState(mockNotices);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) { setLoading(false); return; }

      const { data: profileData } = await supabase.from('profiles').select('school_id').eq('user_id', user.id).single();
      if (profileData?.school_id) {
        const { data: schoolData } = await supabase.from('schools').select('name').eq('id', profileData.school_id).single();
        setSchool(schoolData);
        
        // TODO: Fetch real notices from database
        // const { data: noticesData } = await supabase.from('notices').select('*').eq('school_id', profileData.school_id).order('created_at', { ascending: false });
        // setNotices(noticesData || []);
      }
      setLoading(false);
    }
    getData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  if (!user) return <div className="flex h-screen items-center justify-center bg-gray-50"><p className="text-gray-500">Please log in.</p></div>;

  const handleMarkAsRead = (id: number) => {
    setNotices(prev => prev.map(n => n.id === id ? { ...n, isNew: false } : n));
  };

  const handleMarkAllRead = () => {
    setNotices(prev => prev.map(n => ({ ...n, isNew: false })));
  };

  const getIcon = (type: string) => {
    if (type === 'meeting') return <Users className="h-5 w-5" />;
    if (type === 'academic') return <FileText className="h-5 w-5" />;
    if (type === 'holiday') return <Calendar className="h-5 w-5" />;
    return <Megaphone className="h-5 w-5" />;
  };

  const getIconBg = (type: string) => {
    if (type === 'meeting') return 'bg-purple-50 text-purple-600';
    if (type === 'academic') return 'bg-blue-50 text-blue-600';
    if (type === 'holiday') return 'bg-amber-50 text-amber-600';
    return 'bg-emerald-50 text-emerald-600';
  };

  const filteredNotices = notices.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = notices.filter(n => n.isNew).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Notices</h1>
              <p className="mt-1.5 text-sm text-gray-500">School and class announcements.</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <CheckCircle className="h-4 w-4" /> Mark all as read
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search notices..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
            />
          </div>

          {/* Notices List */}
          <div className="space-y-4">
            {filteredNotices.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 px-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-4">
                  <Bell className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No notices found</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-sm">
                  {searchQuery ? 'Try adjusting your search terms.' : 'You are all caught up! There are no new announcements.'}
                </p>
              </div>
            ) : (
              filteredNotices.map((notice) => (
                <div 
                  key={notice.id} 
                  className={`group rounded-2xl border p-6 transition-all hover:shadow-md ${
                    notice.isNew ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${getIconBg(notice.type)}`}>
                      {getIcon(notice.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{notice.title}</h3>
                          {notice.isNew && (
                            <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                              New
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{notice.date}</span>
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5 font-medium text-gray-700">
                          <Mail className="h-3 w-3" /> From: {notice.from}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3 w-3" /> Audience: {notice.audience}
                        </span>
                      </div>

                      {/* Message Body */}
                      <p className="text-sm text-gray-600 leading-relaxed mb-4">
                        {notice.content}
                      </p>

                      {/* Actions */}
                      {notice.isNew && (
                        <button 
                          onClick={() => handleMarkAsRead(notice.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </main>
      </div>
    </div>
  );
}