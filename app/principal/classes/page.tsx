'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, Plus, MoreVertical, Trash2, Edit3, Users, BookOpen, 
  GraduationCap, UserX, Filter, ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Mock Data Generator ---
const generateMockClasses = () => {
  const teachers = ['Ram Sharma', 'Sita Poudel', 'Hari Thapa', 'Gita Rai', 'Bishnu KC'];
  return Array.from({ length: 10 }, (_, i) => ({
    id: `class-${i + 1}`,
    name: `Class ${i + 1}`,
    sections: [
      { id: `s-${i+1}-a`, name: 'A', teacher: teachers[i % 5], students: Math.floor(Math.random() * 10) + 20 },
      { id: `s-${i+1}-b`, name: 'B', teacher: i % 2 === 0 ? teachers[(i + 1) % 5] : null, students: Math.floor(Math.random() * 10) + 15 },
      ...(i > 4 ? [{ id: `s-${i+1}-c`, name: 'C', teacher: teachers[(i + 2) % 5], students: Math.floor(Math.random() * 10) + 10 }] : [])
    ]
  }));
};

export default function ClassesPage() {
  const [classes] = useState(generateMockClasses());
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Logic
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [classes, searchQuery]);

  // Stats Calculation
  const stats = {
    totalClasses: classes.length,
    totalSections: classes.reduce((acc, c) => acc + c.sections.length, 0),
    totalStudents: classes.reduce((acc, c) => acc + c.sections.reduce((sAcc, s) => sAcc + s.students, 0), 0),
    unassignedSections: classes.reduce((acc, c) => acc + c.sections.filter(s => !s.teacher).length, 0),
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-pink-100 text-pink-600'];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Classes & Sections</h1>
              <p className="mt-1.5 text-sm text-gray-500">Organize your school's academic structure and assign class teachers.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4" /> Filter Level
              </button>
              <Link href="/classes/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" /> Add Class
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BookOpen className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Total Classes</p><p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.totalClasses}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><Users className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Total Sections</p><p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.totalSections}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><GraduationCap className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Total Students</p><p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.totalStudents}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><UserX className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Unassigned Teachers</p><p className="text-2xl font-bold text-amber-700 tabular-nums">{stats.unassignedSections}</p></div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search classes..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
              />
            </div>
          </div>

          {/* Classes Grid */}
          {filteredClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4"><BookOpen className="h-8 w-8 text-gray-400" /></div>
              <h3 className="text-lg font-semibold text-gray-900">No classes found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredClasses.map((cls) => {
                const classTotalStudents = cls.sections.reduce((acc, s) => acc + s.students, 0);
                return (
                  <div key={cls.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
                    {/* Class Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-5 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Users className="h-3 w-3" /> {classTotalStudents} Students • {cls.sections.length} Sections
                        </p>
                      </div>
                      <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Sections List */}
                    <div className="p-5 flex-1 space-y-3">
                      {cls.sections.map((section) => (
                        <div key={section.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 flex items-center justify-between group hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-700 shadow-sm">
                              {section.name}
                            </div>
                            <div>
                              {section.teacher ? (
                                <div className="flex items-center gap-2">
                                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${getAvatarColor(section.teacher)}`}>
                                    {getInitials(section.teacher)}
                                  </div>
                                  <p className="text-sm font-medium text-gray-900">{section.teacher}</p>
                                </div>
                              ) : (
                                <p className="text-sm font-medium text-amber-700 flex items-center gap-1.5">
                                  <AlertCircle className="h-3.5 w-3.5" /> No Teacher Assigned
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-0.5">{section.students} Students</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="rounded-md p-1.5 text-gray-400 hover:bg-white hover:text-blue-600 transition-colors" title="Edit">
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button className="rounded-md p-1.5 text-gray-400 hover:bg-white hover:text-red-600 transition-colors" title="Delete Section">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Class Footer */}
                    <div className="border-t border-gray-100 p-3 bg-gray-50/50">
                      <button className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors">
                        <Plus className="h-3.5 w-3.5" /> Add Section to {cls.name}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}