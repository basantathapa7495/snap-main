'use client';

import { X, Search, HelpCircle, BookOpen, MessageSquare, ChevronRight } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  const faqs = [
    'How do I add a new student?',
    'How to approve exam results?',
    'How to generate fee receipts?',
    'How to send SMS notices?',
  ];

  const documents = [
    { title: 'Getting Started Guide', description: 'Learn the basics of SNAP' },
    { title: 'Principal Dashboard Manual', description: 'Complete dashboard guide' },
    { title: 'Fee Management Guide', description: 'Manage fees and receipts' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Help & Support</h2>
              <p className="text-blue-100 text-sm mt-0.5">We're here to help you manage your school</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search help articles..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* FAQ Section */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              Frequently Asked Questions
            </h3>
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <button 
                  key={index}
                  className="w-full text-left rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-between group"
                >
                  {faq}
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Need Help Section */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-xs text-gray-600 mb-4">
              Our SNAP support team is here to help school principals across Nepal.
            </p>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors w-full sm:w-auto">
              <MessageSquare className="h-4 w-4" />
              Contact Support
            </button>
          </div>

          {/* Documentation Section */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Documentation
            </h3>
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {doc.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
                  </div>
                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    Open
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}