'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, Filter, Eye, X, UserPlus, Users, GraduationCap, 
  CheckCircle, AlertCircle, XCircle, ChevronLeft, ChevronRight,
  Activity, BookOpen, Wallet, FolderOpen, MessageSquare, Phone, Mail
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Static Mock Data (Prevents Hydration Mismatch) ---
const mockStudents = [
  { id: 'STU1001', name: 'Aarav Sharma', class: 10, section: 'A', attendance: 96, feeStatus: 'Paid', parentPhone: '9841000001', email: 'aarav@snap.edu.np' },
  { id: 'STU1002', name: 'Vivaan Singh', class: 10, section: 'A', attendance: 88, feeStatus: 'Due', parentPhone: '9841000002', email: 'vivaan@snap.edu.np' },
  { id: 'STU1003', name: 'Aditya Verma', class: 9, section: 'B', attendance: 92, feeStatus: 'Paid', parentPhone: '9841000003', email: 'aditya@snap.edu.np' },
  { id: 'STU1004', name: 'Sai Patel', class: 9, section: 'B', attendance: 78, feeStatus: 'Overdue', parentPhone: '9841000004', email: 'sai@snap.edu.np' },
  { id: 'STU1005', name: 'Arjun Reddy', class: 8, section: 'A', attendance: 96, feeStatus: 'Paid', parentPhone: '9841000005', email: 'arjun@snap.edu.np' },
  { id: 'STU1006', name: 'Reyansh Kumar', class: 8, section: 'A', attendance: 85, feeStatus: 'Due', parentPhone: '9841000006', email: 'reyansh@snap.edu.np' },
  { id: 'STU1007', name: 'Krishna Iyer', class: 7, section: 'C', attendance: 91, feeStatus: 'Paid', parentPhone: '9841000007', email: 'krishna@snap.edu.np' },
  { id: 'STU1008', name: 'Ishaan Gupta', class: 7, section: 'C', attendance: 72, feeStatus: 'Overdue', parentPhone: '9841000008', email: 'ishaan@snap.edu.np' },
  { id: 'STU1009', name: 'Shaurya Joshi', class: 6, section: 'A', attendance: 94, feeStatus: 'Paid', parentPhone: '9841000009', email: 'shaurya@snap.edu.np' },
  { id: 'STU1010', name: 'Atharv Pandey', class: 6, section: 'A', attendance: 89, feeStatus: 'Due', parentPhone: '9841000010', email: 'atharv@snap.edu.np' },
  { id: 'STU1011', name: 'Ananya Sharma', class: 10, section: 'B', attendance: 97, feeStatus: 'Paid', parentPhone: '9841000011', email: 'ananya@snap.edu.np' },
  { id: 'STU1012', name: 'Diya Patel', class: 9, section: 'A', attendance: 93, feeStatus: 'Paid', parentPhone: '9841000012', email: 'diya@snap.edu.np' },
  { id: 'STU1013', name: 'Saanvi Singh', class: 8, section: 'B', attendance: 88, feeStatus: 'Due', parentPhone: '9841000013', email: 'saanvi@snap.edu.np' },
  { id: 'STU1014', name: 'Aadhya Verma', class: 7, section: 'A', attendance: 95, feeStatus: 'Paid', parentPhone: '9841000014', email: 'aadhya@snap.edu.np' },
  { id: 'STU1015', name: 'Myra Reddy', class: 6, section: 'C', attendance: 90, feeStatus: 'Paid', parentPhone: '9841000015', email: 'myra@snap.edu.np' },
  { id: 'STU1016', name: 'Pari Kumar', class: 10, section: 'C', attendance: 82, feeStatus: 'Overdue', parentPhone: '9841000016', email: 'pari@snap.edu.np' },
  { id: 'STU1017', name: 'Anaya Iyer', class: 9, section: 'C', attendance: 91, feeStatus: 'Paid', parentPhone: '9841000017', email: 'anaya@snap.edu.np' },
  { id: 'STU1018', name: 'Navya Gupta', class: 8, section: 'C', attendance: 87, feeStatus: 'Due', parentPhone: '9841000018', email: 'navya@snap.edu.np' },
  { id: 'STU1019', name: 'Kiara Joshi', class: 7, section: 'B', attendance: 94, feeStatus: 'Paid', parentPhone: '9841000019', email: 'kiara@snap.edu.np' },
  { id: 'STU1020', name: 'Ishita Pandey', class: 6, section: 'B', attendance: 89, feeStatus: 'Paid', parentPhone: '9841000020', email: 'ishita@snap.edu.np' },
];

export default function StudentsPage() {
  const [students] = useState(mockStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = classFilter === 'All' || student.class.toString() === classFilter;
      const matchesSection = sectionFilter === 'All' || student.section === sectionFilter;
      return matchesSearch && matchesClass && matchesSection;
    });
  }, [students, searchQuery, classFilter, sectionFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getFeeBadge = (status: string) => {
    if (status === 'Paid') return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200"><CheckCircle className="h-3 w-3" /> Paid</span>;
    if (status === 'Due') return <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200"><AlertCircle className="h-3 w-3" /> Due</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200"><XCircle className="h-3 w-3" /> Overdue</span>;
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-700 bg-green-50 border-green-200';
    if (rate >= 75) return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-red-700 bg-red-50 border-red-200';
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Students</h1>
              <p className="mt-1.5 text-sm text-gray-500">Manage student records, attendance, and fee statuses.</p>
            </div>
            <Link href="/students/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
              <UserPlus className="h-4 w-4" /> Add Student
            </Link>
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Users className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Total Students</p><p className="text-2xl font-bold text-gray-900 tabular-nums">{students.length}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600"><CheckCircle className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Fees Paid</p><p className="text-2xl font-bold text-green-700 tabular-nums">{students.filter(s => s.feeStatus === 'Paid').length}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><AlertCircle className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Fees Due</p><p className="text-2xl font-bold text-orange-700 tabular-nums">{students.filter(s => s.feeStatus === 'Due').length}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><XCircle className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Fees Overdue</p><p className="text-2xl font-bold text-red-700 tabular-nums">{students.filter(s => s.feeStatus === 'Overdue').length}</p></div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search by name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
              <div className="relative w-full sm:w-32">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="All">All Classes</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div className="relative w-full sm:w-32">
                <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 px-4 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="All">All Sections</option>
                  {['A', 'B', 'C'].map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {paginatedStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4"><GraduationCap className="h-8 w-8 text-gray-400" /></div>
                <h3 className="text-lg font-semibold text-gray-900">No students found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium text-gray-500">Student</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Class</th>
                      <th className="px-6 py-4 font-medium text-gray-500 hidden md:table-cell">Section</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Attendance</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Fee Status</th>
                      <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">{student.name.charAt(0)}</div>
                            <div>
                              <p className="font-semibold text-gray-900">{student.name}</p>
                              <p className="text-xs text-gray-500">{student.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="font-medium text-gray-900">Class {student.class}</span></td>
                        <td className="px-6 py-4 hidden md:table-cell"><span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{student.section}</span></td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${getAttendanceColor(student.attendance)}`}>
                            {student.attendance}%
                          </span>
                        </td>
                        <td className="px-6 py-4">{getFeeBadge(student.feeStatus)}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => setSelectedStudent(student)} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors">
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-3">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of <span className="font-medium text-gray-900">{filteredStudents.length}</span> students
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ✅ Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"><X className="h-4 w-4" /></button>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-bold text-blue-600 shadow-lg">{selectedStudent.name.charAt(0)}</div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-blue-100 text-sm flex items-center gap-2 mt-1">
                    <GraduationCap className="h-4 w-4" /> Class {selectedStudent.class} - Section {selectedStudent.section} • ID: {selectedStudent.id}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Parent Phone</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" /> {selectedStudent.parentPhone}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2 truncate">
                    <Mail className="h-4 w-4 text-gray-500" /> {selectedStudent.email}
                  </p>
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Student Management</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:bg-blue-50 hover:border-blue-200 transition-all group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200"><Activity className="h-5 w-5" /></div>
                  <div><p className="font-semibold text-gray-900">Recent Activity</p><p className="text-xs text-gray-500">Logs & updates</p></div>
                </button>
                <button className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:bg-emerald-50 hover:border-emerald-200 transition-all group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200"><BookOpen className="h-5 w-5" /></div>
                  <div><p className="font-semibold text-gray-900">Grades</p><p className="text-xs text-gray-500">Marks & report cards</p></div>
                </button>
                <button className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:bg-orange-50 hover:border-orange-200 transition-all group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-200"><Wallet className="h-5 w-5" /></div>
                  <div><p className="font-semibold text-gray-900">Fees</p><p className="text-xs text-gray-500">Payments & dues</p></div>
                </button>
                <button className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:bg-purple-50 hover:border-purple-200 transition-all group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200"><FolderOpen className="h-5 w-5" /></div>
                  <div><p className="font-semibold text-gray-900">Documents</p><p className="text-xs text-gray-500">Files & certificates</p></div>
                </button>
                <button className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:bg-pink-50 hover:border-pink-200 transition-all group col-span-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 text-pink-600 group-hover:bg-pink-200"><MessageSquare className="h-5 w-5" /></div>
                  <div><p className="font-semibold text-gray-900">Behavior & Discipline</p><p className="text-xs text-gray-500">Incidents, warnings, and positive notes</p></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}