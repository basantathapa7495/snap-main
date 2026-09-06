'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { 
  FileText, Award, Wallet, Calendar, MessageSquare, 
  ChevronDown, LifeBuoy, Mail, Phone, School, 
  BookOpen, Send
} from 'lucide-react';

// --- Mock Data (Based on your reference HTML) ---
const quickGuides = [
  { 
    id: 1, 
    title: 'How to submit an assignment', 
    description: 'Learn how to upload files and submit your homework before the deadline.', 
    icon: FileText, 
    color: 'bg-blue-50 text-blue-600' 
  },
  { 
    id: 2, 
    title: 'How to view report cards', 
    description: 'Access your terminal report cards and download them as PDF.', 
    icon: Award, 
    color: 'bg-purple-50 text-purple-600' 
  },
  { 
    id: 3, 
    title: 'Checking fee status', 
    description: 'View your monthly fee structure, payment history, and download receipts.', 
    icon: Wallet, 
    color: 'bg-emerald-50 text-emerald-600' 
  },
  { 
    id: 4, 
    title: 'Understanding your timetable', 
    description: 'How to read your weekly schedule and find your classroom locations.', 
    icon: Calendar, 
    color: 'bg-amber-50 text-amber-600' 
  },
];

const faqs = [
  { 
    id: 1, 
    question: 'How do I reset my password?', 
    answer: 'Go to the login page and click on "Forgot Password". Enter your registered email or student ID, and follow the instructions sent to your email.' 
  },
  { 
    id: 2, 
    question: 'Can I submit an assignment after the due date?', 
    answer: 'Late submissions are only allowed if your teacher has enabled the "Allow Late Submissions" option. Otherwise, the submit button will be disabled after the deadline.' 
  },
  { 
    id: 3, 
    question: 'How do I pay my school fees online?', 
    answer: 'Navigate to the "Fees" section, click on "Pay Now" next to the pending installment, and choose your preferred payment method (eSewa, Khalti, or Bank Transfer).' 
  },
  { 
    id: 4, 
    question: 'Who do I contact for academic issues?', 
    answer: 'For subject-related doubts, please contact your respective subject teacher. For general academic or administrative issues, reach out to your class teacher or the school admin.' 
  },
];

export default function StudentHelpPage() {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Help & Support</h1>
            <p className="mt-1.5 text-sm text-gray-500">Guides and resources for students using SNAP.</p>
          </div>

          {/* Quick Guides Grid */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" /> Quick Guides
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickGuides.map((guide) => {
                const Icon = guide.icon;
                return (
                  <div 
                    key={guide.id} 
                    className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${guide.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {guide.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FAQs & Contact Support Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* FAQ Accordion (2/3 width) */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" /> Frequently Asked Questions
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {faqs.map((faq) => (
                  <div key={faq.id} className="p-6">
                    <button 
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <span className="text-sm font-semibold text-gray-900 pr-4">{faq.question}</span>
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${openFaq === faq.id ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === faq.id && (
                      <p className="mt-3 text-sm text-gray-600 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Support Card (1/3 width) */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm flex flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white mb-4">
                <LifeBuoy className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Need help?</h3>
              <p className="text-sm text-gray-600 mb-6 flex-1">
                Contact your class teacher or school admin for immediate assistance.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-blue-600">
                    <School className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">{school?.name || 'School Admin'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-blue-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">admin@school.edu.np</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-blue-600">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">+977-9800000000</span>
                </div>
              </div>

              <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                <Send className="h-4 w-4" /> Contact Support
              </button>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}