'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { 
  Search, GraduationCap, Phone, Mail, Trash2, Edit3, Users, UserPlus,
  Key, Copy, Eye, EyeOff, RefreshCw,
  UserCheck, UserX, Coffee, CalendarDays, FileText, BarChart3, FolderOpen, X, Filter,
  Upload, MessageSquare, Check, ChevronDown, AlertCircle
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function TeachersPage() {
  const [user, setUser] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedTeacherForLogin, setSelectedTeacherForLogin] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingLogin, setIsCreatingLogin] = useState(false);
  const [loginCreated, setLoginCreated] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [schoolId, setSchoolId] = useState<string | null>(null);
  
  // New States for Bulk Actions & Import
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [bulkMessageText, setBulkMessageText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) { setLoading(false); return; }

      const { data: profileData } = await supabase.from('profiles').select('school_id').eq('user_id', user.id).single();

      if (profileData?.school_id) {
        setSchoolId(profileData.school_id); // ✅ Add this line!

        const { data: teachersData } = await supabase
          .from('teachers')
          .select('*')
          .eq('school_id', profileData.school_id)
          .order('created_at', { ascending: false });
        // ... rest of your code

        // MOCKING DAILY STATUS FOR UI DEMO
        const statuses = ['present', 'present', 'present', 'absent', 'on_leave'];
        const teachersWithStatus = (teachersData || []).map((t, i) => ({
          ...t,
          todayStatus: statuses[i % statuses.length] 
        }));
        setTeachers(teachersWithStatus);
      }
      setLoading(false);
    }
    getData();
  }, []);

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(teachers.map(t => t.subject).filter(Boolean));
    return ['All', ...Array.from(subjects)];
  }, [teachers]);

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = teacher.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || teacher.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const stats = {
    total: teachers.length,
    present: teachers.filter(t => t.todayStatus === 'present').length,
    absent: teachers.filter(t => t.todayStatus === 'absent').length,
    onLeave: teachers.filter(t => t.todayStatus === 'on_leave').length,
  };

  // Bulk Action Handlers
  const toggleSelectAll = () => {
    if (selectedTeacherIds.size === filteredTeachers.length) {
      setSelectedTeacherIds(new Set());
    } else {
      setSelectedTeacherIds(new Set(filteredTeachers.map(t => t.id)));
    }
  };

  const toggleSelectTeacher = (id: string) => {
    const newSet = new Set(selectedTeacherIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTeacherIds(newSet);
  };

  const handleSendBulkMessage = () => {
    alert(`Sending message to ${selectedTeacherIds.size} teachers:\n\n"${bulkMessageText}"`);
    setIsBulkMessageOpen(false);
    setBulkMessageText('');
  };

  // CSV Import Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1); // Skip header
      const parsed = lines.map(line => {
        const [name, subject, phone, email] = line.split(',');
        return { name: name?.trim(), subject: subject?.trim(), phone: phone?.trim(), email: email?.trim() };
      }).filter(t => t.name);
      setCsvData(parsed);
    };
    reader.readAsText(file);
  };

  const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  setGeneratedPassword(password);
};

// Add this function to open the modal
const openLoginModal = (teacher: any) => {
  setSelectedTeacherForLogin(teacher);
  setLoginEmail('');
  setGeneratedPassword('');
  setLoginCreated(false);
  setIsLoginModalOpen(true);
  generatePassword();
};

// Add this function to create the login
const handleCreateLogin = async () => {
  if (!loginEmail || !generatedPassword) return;
  
  setIsCreatingLogin(true);
  try {
    const response = await fetch('/api/create-teacher-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
        email: loginEmail,
        password: generatedPassword,
        teacherId: selectedTeacherForLogin.id,
        schoolId: schoolId //  Error here
      })
    });

    const data = await response.json();
    
    if (data.success) {
      setLoginCreated(true);
      // Update local state to show login is created
      setTeachers(prev => prev.map(t => 
        t.id === selectedTeacherForLogin.id 
          ? { ...t, user_id: data.userId }
          : t
      ));
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Failed to create login. Please try again.');
  } finally {
    setIsCreatingLogin(false);
  }
};
  // Add this copy function
const copyToClipboard = (text: string, field: string) => {
  navigator.clipboard.writeText(text);
  setCopiedField(field);
  setTimeout(() => setCopiedField(''), 2000);
};

  const handleImportCSV = () => {
    alert(`Importing ${csvData.length} teachers from CSV! (Connect to Supabase insert here)`);
    setIsImportOpen(false);
    setCsvData([]);
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'T';
  const getAvatarColor = (index: number) => {
    const colors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-pink-100 text-pink-600'];
    return colors[index % colors.length];
  };

  const getStatusBadge = (status: string) => {
    if (status === 'present') return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200"><UserCheck className="h-3 w-3" /> Present</span>;
    if (status === 'absent') return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200"><UserX className="h-3 w-3" /> Absent</span>;
    if (status === 'on_leave') return <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200"><Coffee className="h-3 w-3" /> On Leave</span>;
    return null;
  };

  // Mock Sparkline Data (30 days)
  const sparklineData = Array.from({ length: 30 }, (_, i) => ({
    day: i,
    attendance: Math.floor(Math.random() * (100 - 75) + 75)
  }));

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  if (!user) return <div className="flex h-screen items-center justify-center bg-gray-50"><p className="text-gray-500">Please log in.</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Teachers</h1>
              <p className="mt-1.5 text-sm text-gray-500">Manage your school's teaching staff and daily attendance.</p>
            </div>
            <div className="flex items-center gap-3">
              {/* ✅ Bulk Import Button */}
              <button 
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-4 w-4" /> Import CSV
              </button>
              <Link href="/teachers/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                <UserPlus className="h-4 w-4" /> Add Teacher
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Users className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Total Teachers</p><p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.total}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600"><UserCheck className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Present Today</p><p className="text-2xl font-bold text-green-700 tabular-nums">{stats.present}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><UserX className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Absent Today</p><p className="text-2xl font-bold text-red-700 tabular-nums">{stats.absent}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Coffee className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">On Leave</p><p className="text-2xl font-bold text-orange-700 tabular-nums">{stats.onLeave}</p></div>
              </div>
            </div>
          </div>

          {/* Toolbar & Bulk Actions */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
              <div className="relative w-full sm:w-auto">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="w-full sm:w-48 appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  {uniqueSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            </div>

            {/* ✅ Bulk Action Button */}
            {selectedTeacherIds.size > 0 && (
              <button 
                onClick={() => setIsBulkMessageOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <MessageSquare className="h-4 w-4" /> Message {selectedTeacherIds.size} Selected
              </button>
            )}
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {filteredTeachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4"><GraduationCap className="h-8 w-8 text-gray-400" /></div>
                <h3 className="text-lg font-semibold text-gray-900">No teachers found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedTeacherIds.size === filteredTeachers.length && filteredTeachers.length > 0}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4 font-medium text-gray-500">Teacher</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Subject</th>
                      <th className="px-6 py-4 font-medium text-gray-500 hidden md:table-cell">Contact</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                      <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTeachers.map((teacher, index) => (
                      <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={selectedTeacherIds.has(teacher.id)}
                            onChange={() => toggleSelectTeacher(teacher.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${getAvatarColor(index)}`}>{getInitials(teacher.name)}</div>
                            <p className="font-semibold text-gray-900">{teacher.name || 'Unnamed'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{teacher.subject || 'Not assigned'}</span></td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex flex-col gap-1">
                            {teacher.phone && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="h-3 w-3" /> {teacher.phone}</div>}
                            {teacher.email && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="h-3 w-3" /> {teacher.email}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(teacher.todayStatus)}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
  onClick={() => {
    console.log("Button clicked for:", teacher.name); //  Add this to test
    openLoginModal(teacher); 
  }}
  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 border border-purple-100 transition-colors"
>
  <Key className="h-3.5 w-3.5" /> Create Login
</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ✅ Teacher Detail Modal (With Sparkline & Substitute Assignment) */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTeacher(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <button onClick={() => setSelectedTeacher(null)} className="absolute top-4 right-4 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"><X className="h-4 w-4" /></button>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-bold text-blue-600 shadow-lg">{getInitials(selectedTeacher.name)}</div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedTeacher.name}</h2>
                  <p className="text-blue-100 text-sm flex items-center gap-2 mt-1">
                    <GraduationCap className="h-4 w-4" /> {selectedTeacher.subject || 'No Subject Assigned'}
                  </p>
                  <div className="mt-2">{getStatusBadge(selectedTeacher.todayStatus)}</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* ✅ Substitute Teacher Assignment (Only shows if absent/on leave) */}
              {(selectedTeacher.todayStatus === 'absent' || selectedTeacher.todayStatus === 'on_leave') && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Assign Substitute Teacher
                  </h3>
                  <div className="flex gap-3">
                    <select className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                      <option value="">Select a substitute...</option>
                      {teachers.filter(t => t.id !== selectedTeacher.id && t.todayStatus === 'present').map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => alert(`Substitute assigned to cover ${selectedTeacher.name}'s classes!`)}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {selectedTeacher.phone || 'N/A'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2 truncate"><Mail className="h-4 w-4 text-gray-400" /> {selectedTeacher.email || 'N/A'}</p>
                </div>
              </div>

              {/* ✅ Mini Performance Sparkline */}
              <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-900">30-Day Attendance Trend</h3>
                  <span className="text-xs font-semibold text-green-600">92% Avg</span>
                </div>
                <div className="h-24 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSpark" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpark)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:bg-blue-50 hover:border-blue-200 transition-all group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200"><CalendarDays className="h-5 w-5" /></div>
                  <div><p className="font-semibold text-gray-900">Timetable</p><p className="text-xs text-gray-500">View weekly schedule</p></div>
                </button>
                <button className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:bg-orange-50 hover:border-orange-200 transition-all group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-200"><FileText className="h-5 w-5" /></div>
                  <div><p className="font-semibold text-gray-900">Leave Request</p><p className="text-xs text-gray-500">Approve or reject</p></div>
                </button>
                <button className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:bg-emerald-50 hover:border-emerald-200 transition-all group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200"><BarChart3 className="h-5 w-5" /></div>
                  <div><p className="font-semibold text-gray-900">Performance</p><p className="text-xs text-gray-500">Attendance & results</p></div>
                </button>
                <button className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:bg-purple-50 hover:border-purple-200 transition-all group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200"><FolderOpen className="h-5 w-5" /></div>
                  <div><p className="font-semibold text-gray-900">Documents</p><p className="text-xs text-gray-500">Certificates & files</p></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Bulk Message Modal */}
      {isBulkMessageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsBulkMessageOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Send Bulk Message</h3>
              <button onClick={() => setIsBulkMessageOpen(false)} className="rounded-full p-1 hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Sending to <span className="font-semibold text-gray-900">{selectedTeacherIds.size} teachers</span>.</p>
            <textarea 
              value={bulkMessageText}
              onChange={(e) => setBulkMessageText(e.target.value)}
              placeholder="Type your message here (e.g., Staff meeting at 4 PM today)..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
              rows={4}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setIsBulkMessageOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={handleSendBulkMessage} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Send Message</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Bulk Import CSV Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsImportOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Import Teachers via CSV</h3>
              <button onClick={() => setIsImportOpen(false)} className="rounded-full p-1 hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            
            {!fileInputRef.current?.files?.[0] ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Upload className="h-10 w-10 text-gray-400 mb-3" />
                <p className="text-sm font-semibold text-gray-900">Click to upload CSV</p>
                <p className="text-xs text-gray-500 mt-1">Columns: Name, Subject, Phone, Email</p>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </div>
            ) : (
              <div>
                <div className="mb-4 rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">{csvData.length} teachers parsed successfully</p>
                    <p className="text-xs text-green-700">Ready to import into your database.</p>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 mb-4">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50">
                      <tr><th className="p-2">Name</th><th className="p-2">Subject</th><th className="p-2">Phone</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {csvData.slice(0, 5).map((t, i) => (
                        <tr key={i}><td className="p-2">{t.name}</td><td className="p-2">{t.subject}</td><td className="p-2">{t.phone}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => { setIsImportOpen(false); setCsvData([]); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
                  <button onClick={handleImportCSV} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Import {csvData.length} Teachers</button>
                </div>
              </div>
            )}
          </div>
        </div>

        
      )}

      {/* ✅ Create Teacher Login Modal */}
{isLoginModalOpen && selectedTeacherForLogin && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsLoginModalOpen(false)}>
    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
      
      {/* Modal Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Create Teacher Login</h2>
              <p className="text-purple-100 text-sm mt-0.5">{selectedTeacherForLogin.name}</p>
            </div>
          </div>
          <button onClick={() => setIsLoginModalOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Modal Body */}
      <div className="p-6 space-y-4">
        
        {!loginCreated ? (
          <>
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher's Email Address</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="teacher@school.edu.np"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <p className="text-xs text-gray-500 mt-1">This will be their login username</p>
            </div>

            {/* Generated Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Auto-Generated Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={generatedPassword}
                  readOnly
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-20 text-sm bg-gray-50 font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                  </button>
                  <button 
                    onClick={generatePassword}
                    className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                    title="Generate new password"
                  >
                    <RefreshCw className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Teacher should change this after first login</p>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                This will create a Supabase auth account. The teacher can log in at <span className="font-semibold">/auth/login?role=teacher</span>
              </p>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Login Created Successfully!</h3>
              <p className="text-sm text-gray-500 mt-1">Share these credentials with the teacher</p>
            </div>

            {/* Credentials Display */}
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Email (Username)</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono font-medium text-gray-900">{loginEmail}</p>
                  <button 
                    onClick={() => copyToClipboard(loginEmail, 'email')}
                    className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700"
                  >
                    {copiedField === 'email' ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Password</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono font-medium text-gray-900">{generatedPassword}</p>
                  <button 
                    onClick={() => copyToClipboard(generatedPassword, 'password')}
                    className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700"
                  >
                    {copiedField === 'password' ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-800">
                <strong>Login URL:</strong> <span className="font-mono">/auth/login?role=teacher</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      {!loginCreated && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={() => setIsLoginModalOpen(false)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreateLogin}
            disabled={!loginEmail || isCreatingLogin}
            className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCreatingLogin ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Creating...
              </>
            ) : (
              <>
                <Key className="h-4 w-4" />
                Create Login
              </>
            )}
          </button>
        </div>
      )}

      {loginCreated && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end">
          <button 
            onClick={() => setIsLoginModalOpen(false)}
            className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      )}
    </div>
  </div>
)}
    </div>
  );
}