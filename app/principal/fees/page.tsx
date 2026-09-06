'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, FileText, Download, Wallet, TrendingUp, AlertCircle, Clock, 
  CheckCircle, XCircle, Filter, Search
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Mock Data ---
const monthlyTrendData = [
  { month: 'Jan', collected: 450000, expected: 500000 },
  { month: 'Feb', collected: 480000, expected: 500000 },
  { month: 'Mar', collected: 520000, expected: 500000 },
  { month: 'Apr', collected: 410000, expected: 500000 },
  { month: 'May', collected: 490000, expected: 500000 },
  { month: 'Jun', collected: 550000, expected: 500000 },
];

const paymentMethodData = [
  { name: 'Cash', value: 45, color: '#10b981' },    // Emerald
  { name: 'eSewa', value: 25, color: '#8b5cf6' },   // Violet
  { name: 'Khalti', value: 15, color: '#ec4899' },  // Pink
  { name: 'Bank', value: 15, color: '#3b82f6' },    // Blue
];

const recentPaymentsData = [
  { id: 1, student: 'Aarav Sharma', class: '10-A', amount: 15000, date: '2023-10-24', method: 'eSewa', status: 'Paid' },
  { id: 2, student: 'Priya Patel', class: '9-B', amount: 12000, date: '2023-10-23', method: 'Cash', status: 'Paid' },
  { id: 3, student: 'Rahul Verma', class: '8-A', amount: 10000, date: '2023-10-20', method: 'Bank', status: 'Pending' },
  { id: 4, student: 'Sneha Gupta', class: '10-C', amount: 15000, date: '2023-10-15', method: 'Khalti', status: 'Overdue' },
  { id: 5, student: 'Vikram Singh', class: '7-A', amount: 8000, date: '2023-10-24', method: 'Cash', status: 'Paid' },
  { id: 6, student: 'Ananya Joshi', class: '9-A', amount: 12000, date: '2023-10-22', method: 'eSewa', status: 'Paid' },
];

export default function FeesPage() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const stats = {
    expected: 1200000,
    collected: 840000,
    pending: 240000,
    overdue: 120000,
  };

  // Filter Table Data
  const filteredPayments = useMemo(() => {
    return recentPaymentsData.filter((p) => {
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesSearch = p.student.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [statusFilter, searchQuery]);

  const getStatusBadge = (status: string) => {
    if (status === 'Paid') return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200"><CheckCircle className="h-3 w-3" /> Paid</span>;
    if (status === 'Pending') return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200"><Clock className="h-3 w-3" /> Pending</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200"><XCircle className="h-3 w-3" /> Overdue</span>;
  };

  const formatCurrency = (amount: number) => `NPR ${amount.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        
        {/* ✅ Added pt-32 for extra breathing room below TopBar */}
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header & Action Buttons */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Fees & Finance</h1>
              <p className="mt-1.5 text-sm text-gray-500">Track collections, manage structures, and generate receipts.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                <Plus className="h-4 w-4" /> Create Fee Structure
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                <FileText className="h-4 w-4" /> Generate Receipt
              </button>
              {/* ✅ Export Report with Blue Background */}
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" /> Export Report
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Wallet className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Expected</p><p className="text-2xl font-bold text-gray-900 tabular-nums">{formatCurrency(stats.expected)}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600"><TrendingUp className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Collected</p><p className="text-2xl font-bold text-green-700 tabular-nums">{formatCurrency(stats.collected)}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Pending</p><p className="text-2xl font-bold text-amber-700 tabular-nums">{formatCurrency(stats.pending)}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><AlertCircle className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-gray-500">Overdue</p><p className="text-2xl font-bold text-red-700 tabular-nums">{formatCurrency(stats.overdue)}</p></div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Collection Trend (Double Bar Chart) */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Collection Trend</h3>
                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-blue-500"></div>Collected</div>
                  <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-gray-300"></div>Expected</div>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value: any) => `${value/1000}k`} />
                    <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 formatter={((value: any) => [formatCurrency(value), 'Amount']) as any}
                  />
                    <Bar dataKey="expected" fill="#d1d5db" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="collected" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods (Donut Chart) */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Methods</h3>
              <div className="flex-1 flex items-center justify-center relative">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={paymentMethodData} 
                        innerRadius={60} 
                        outerRadius={85} 
                        paddingAngle={3} 
                        dataKey="value" 
                        stroke="none"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Custom Legend */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {paymentMethodData.map((method) => (
                  <div key={method.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: method.color }}></div>
                      <span className="text-xs font-medium text-gray-700">{method.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{method.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Payments Table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold text-gray-900">Recent Payments</h3>
              
              {/* Left Side Filters & Search */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search student..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                  {['All', 'Paid', 'Pending', 'Overdue'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                        statusFilter === status 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-500">Student</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Class</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Amount</th>
                    <th className="px-6 py-4 font-medium text-gray-500 hidden md:table-cell">Date</th>
                    <th className="px-6 py-4 font-medium text-gray-500 hidden md:table-cell">Method</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No payments found matching your filters.</td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                              {payment.student.charAt(0)}
                            </div>
                            <p className="font-semibold text-gray-900">{payment.student}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {payment.class}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 tabular-nums">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                          {payment.date}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="text-xs font-medium text-gray-700">{payment.method}</span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(payment.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}