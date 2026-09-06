'use client';

import { useState } from 'react';
import { 
  Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle, 
  FileText, X, Save, Briefcase, Thermometer, Siren
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Mock Data ---
const leaveStats = {
  balance: 8,
  used: 4,
  pending: 1,
  totalAnnual: 12
};

const mockLeaveHistory = [
  { id: 1, type: 'Casual', from: '10 Bhadra 2083', to: '10 Bhadra 2083', days: 1, reason: 'Personal work', status: 'Approved', appliedOn: '8 Bhadra' },
  { id: 2, type: 'Sick', from: '2 Bhadra 2083', to: '3 Bhadra 2083', days: 2, reason: 'High fever and body ache', status: 'Approved', appliedOn: '1 Bhadra' },
  { id: 3, type: 'Casual', from: '15 Shrawan 2083', to: '15 Shrawan 2083', days: 1, reason: 'Family event', status: 'Approved', appliedOn: '12 Shrawan' },
  { id: 4, type: 'Emergency', from: '25 Bhadra 2083', to: '26 Bhadra 2083', days: 2, reason: 'Urgent family matter', status: 'Pending', appliedOn: '24 Bhadra' },
  { id: 5, type: 'Sick', from: '5 Ashadh 2083', to: '5 Ashadh 2083', days: 1, reason: 'Migraine', status: 'Rejected', appliedOn: '4 Ashadh' },
];

export default function TeacherLeavePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateDays = () => {
    // Simple mock calculation for UI demo
    if (fromDate && toDate) return 2; 
    return 1;
  };

  const handleSubmitLeave = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsModalOpen(false);
      setFromDate('');
      setToDate('');
      setReason('');
      alert('Leave application submitted successfully!');
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Approved') return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200"><CheckCircle className="h-3 w-3" /> Approved</span>;
    if (status === 'Pending') return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200"><Clock className="h-3 w-3" /> Pending</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200"><XCircle className="h-3 w-3" /> Rejected</span>;
  };

  const getLeaveTypeIcon = (type: string) => {
    if (type === 'Sick') return <Thermometer className="h-4 w-4 text-red-500" />;
    if (type === 'Emergency') return <Siren className="h-4 w-4 text-amber-500" />;
    return <Briefcase className="h-4 w-4 text-blue-500" />;
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Leave Management</h1>
              <p className="mt-1.5 text-sm text-gray-500">Apply for leave and track your requests.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Apply for Leave
            </button>
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Calendar className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Leave Balance</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{leaveStats.balance} <span className="text-sm font-normal text-gray-400">/ {leaveStats.totalAnnual} days</span></p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CheckCircle className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Used This Year</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{leaveStats.used} days</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                  <p className="text-2xl font-bold text-amber-700 tabular-nums">{leaveStats.pending}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Leave History Table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h3 className="text-base font-bold text-gray-900">Leave History</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-500">Type</th>
                    <th className="px-6 py-4 font-medium text-gray-500">From</th>
                    <th className="px-6 py-4 font-medium text-gray-500">To</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Days</th>
                    <th className="px-6 py-4 font-medium text-gray-500 hidden md:table-cell">Reason</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockLeaveHistory.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                            {getLeaveTypeIcon(leave.type)}
                          </div>
                          <span className="font-semibold text-gray-900">{leave.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{leave.from}</td>
                      <td className="px-6 py-4 text-gray-700">{leave.to}</td>
                      <td className="px-6 py-4 font-bold text-gray-900 tabular-nums">{leave.days}</td>
                      <td className="px-6 py-4 hidden md:table-cell text-gray-500 max-w-xs truncate">{leave.reason}</td>
                      <td className="px-6 py-4">{getStatusBadge(leave.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ✅ Apply for Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Apply for Leave</h2>
                <p className="text-blue-100 text-sm mt-1">Submit your leave request to the principal</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Leave Type</label>
                <select 
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                >
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Emergency">Emergency Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">From Date</label>
                  <input 
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">To Date</label>
                  <input 
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Total Days Requested:</span>
                <span className="text-lg font-bold text-blue-900 tabular-nums">{calculateDays()} {calculateDays() === 1 ? 'Day' : 'Days'}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Leave</label>
                <textarea 
                  rows={3} 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a brief reason..."
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" 
                />
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">Your leave balance is <strong>{leaveStats.balance} days</strong>. Applying for more days than your balance may require special approval.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitLeave}
                disabled={isSubmitting || !reason}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}