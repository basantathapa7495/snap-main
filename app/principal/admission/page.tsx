'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { 
  Inbox, CheckCircle, XCircle, Clock, Eye, GraduationCap, 
  Phone, Mail, MapPin, User, X, AlertCircle
} from 'lucide-react';

export default function AdmissionsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch Applications
  useEffect(() => {
    async function fetchApplications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('user_id', user.id)
        .single();

      if (profile?.school_id) {
        const { data } = await supabase
          .from('admission_applications')
          .select('*')
          .eq('school_id', profile.school_id)
          .order('created_at', { ascending: false });
        
        setApplications(data || []);
      }
      setLoading(false);
    }
    fetchApplications();
  }, []);

  // Stats Calculation
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'Pending').length,
    approved: applications.filter(a => a.status === 'Approved').length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
  };

  // Filter Logic
  const filteredApps = statusFilter === 'All' 
    ? applications 
    : applications.filter(a => a.status === statusFilter);

  // Actions
  const handleStatusChange = async (id: string, newStatus: string) => {
    setIsProcessing(true);
    const { error } = await supabase
      .from('admission_applications')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
      setSelectedApp(null);
    } else {
      alert('Failed to update status. Please try again.');
    }
    setIsProcessing(false);
  };

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <TopBar />
        
        {/* ✅ Using pt-24 as requested */}
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Admission Inbox</h1>
            <p className="mt-1.5 text-sm text-gray-500">Review online applications and convert them to students.</p>
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Inbox className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Total</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Pending</p><p className="text-2xl font-bold text-amber-700">{stats.pending}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600"><CheckCircle className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Approved</p><p className="text-2xl font-bold text-green-700">{stats.approved}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><XCircle className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Rejected</p><p className="text-2xl font-bold text-red-700">{stats.rejected}</p></div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-3">
            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  statusFilter === status 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Applications Grid */}
          {filteredApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No applications found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your status filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredApps.map((app) => (
                <div key={app.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                        {getInitials(app.student_name)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{app.student_name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <GraduationCap className="h-3 w-3" /> Class {app.class}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${
                      app.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      app.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {app.status === 'Pending' && <Clock className="h-3 w-3" />}
                      {app.status === 'Approved' && <CheckCircle className="h-3 w-3" />}
                      {app.status === 'Rejected' && <XCircle className="h-3 w-3" />}
                      {app.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="h-3.5 w-3.5" /> {app.parent_phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="h-3.5 w-3.5" /> {app.address || 'No address'}
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedApp(app)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ✅ Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedApp(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-lg font-bold text-blue-600 shadow-lg">
                  {getInitials(selectedApp.student_name)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedApp.student_name}</h2>
                  <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" /> Applying for Class {selectedApp.class}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="rounded-full bg-white/20 p-2 hover:bg-white/30">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Student Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Student Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div><p className="text-xs text-gray-500">Gender</p><p className="text-sm font-medium text-gray-900">{selectedApp.gender || 'N/A'}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div><p className="text-xs text-gray-500">Address</p><p className="text-sm font-medium text-gray-900">{selectedApp.address || 'N/A'}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div><p className="text-xs text-gray-500">Previous School</p><p className="text-sm font-medium text-gray-900">{selectedApp.previous_school || 'N/A'}</p></div>
                    </div>
                  </div>
                </div>

                {/* Parent Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Parent / Guardian</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div><p className="text-xs text-gray-500">Name</p><p className="text-sm font-medium text-gray-900">{selectedApp.parent_name}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div><p className="text-xs text-gray-500">Phone</p><p className="text-sm font-medium text-gray-900">{selectedApp.parent_phone}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium text-gray-900">{selectedApp.parent_email || 'Not provided'}</p></div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedApp.message && (
                <div className="mt-6 rounded-lg bg-gray-50 p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1 font-semibold">Message from Applicant</p>
                  <p className="text-sm text-gray-700 italic">"{selectedApp.message}"</p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
              {selectedApp.status === 'Pending' ? (
                <>
                  <button 
                    onClick={() => handleStatusChange(selectedApp.id, 'Rejected')}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                  <button 
                    onClick={() => handleStatusChange(selectedApp.id, 'Approved')}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : <><CheckCircle className="h-4 w-4" /> Approve & Add Student</>}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <AlertCircle className="h-4 w-4" />
                  This application has already been {selectedApp.status.toLowerCase()}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}