'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { 
  Wallet, CheckCircle, Calendar, Download, FileText, 
  CreditCard, TrendingUp, AlertCircle
} from 'lucide-react';

// --- Mock Data (Based on your reference HTML) ---
const feeStatus = {
  currentMonth: 'Paid',
  amountPaid: 12000,
  nextDue: '25 Bhadra',
  totalExpected: 12000
};

const feeStructure = [
  { id: 1, particular: 'Tuition Fee (Monthly)', amount: 8500, status: 'Paid' },
  { id: 2, particular: 'Lab Fee', amount: 1500, status: 'Paid' },
  { id: 3, particular: 'Library Fee', amount: 500, status: 'Paid' },
  { id: 4, particular: 'Exam Fee', amount: 1500, status: 'Paid' },
];

const paymentHistory = [
  { id: 1, date: '18 Bhadra', amount: 12000, method: 'eSewa', receiptId: 'RCP-2083-089' },
  { id: 2, date: '15 Shrawan', amount: 12000, method: 'Khalti', receiptId: 'RCP-2083-076' },
  { id: 3, date: '12 Ashadh', amount: 12000, method: 'Bank Transfer', receiptId: 'RCP-2083-062' },
];

export default function StudentFeesPage() {
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
      }
      setLoading(false);
    }
    getData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  if (!user) return <div className="flex h-screen items-center justify-center bg-gray-50"><p className="text-gray-500">Please log in.</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Fees</h1>
            <p className="mt-1.5 text-sm text-gray-500">Fee status and payment history.</p>
          </div>

          {/* Stats Row */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-gray-500">This Month</p>
              </div>
              <p className="text-2xl font-bold text-emerald-600 tabular-nums">{feeStatus.currentMonth}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-gray-500">Amount Paid</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">NPR {feeStatus.amountPaid.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-gray-500">Next Due</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{feeStatus.nextDue}</p>
            </div>
          </div>

          {/* Fee Structure Table */}
          <div className="mb-8 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" /> Fee Structure 2083
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-500">Particular</th>
                    <th className="px-6 py-4 font-medium text-gray-500 text-right">Amount</th>
                    <th className="px-6 py-4 font-medium text-gray-500 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {feeStructure.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.particular}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 tabular-nums">NPR {item.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200">
                          <CheckCircle className="h-3 w-3" /> {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-blue-50/30">
                    <td className="px-6 py-4 font-bold text-gray-900">Total (This Month)</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 tabular-nums text-lg">NPR {feeStatus.totalExpected.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200">
                        <CheckCircle className="h-3 w-3" /> Paid
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History Table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" /> Payment History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-500">Date</th>
                    <th className="px-6 py-4 font-medium text-gray-500 text-right">Amount</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Method</th>
                    <th className="px-6 py-4 font-medium text-gray-500 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{payment.date}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 tabular-nums">NPR {payment.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {payment.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                          <Download className="h-3.5 w-3.5" /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}