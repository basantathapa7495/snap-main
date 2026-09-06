'use client';

import { useState } from 'react';
import { 
  Plus, MessageSquare, Send, Bell, Search, X, Radio, 
  Mail, Smartphone, CheckCircle, Clock, User, Reply
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Mock Data ---
const inboxMessages = [
  { id: 1, from: 'Parent of Ram Thapa', subject: 'Request for parent-teacher meeting regarding math performance', date: 'Yesterday', class: 'Grade 10A', unread: true },
  { id: 2, from: 'Parent of Sita Gurung', subject: 'Query about homework submission deadline', date: '2 days ago', class: 'Grade 10B', unread: true },
  { id: 3, from: 'Parent of Arjun Reddy', subject: 'Thank you for the extra support!', date: '1 week ago', class: 'Grade 9A', unread: false },
];

const sentNotices = [
  { id: 1, title: 'Reminder: Unit Test 2 on 21 Bhadra', audience: 'Grade 10B students & parents', date: '3 days ago', channels: ['In-app', 'SMS'], type: 'Notice' },
  { id: 2, title: 'Extra class this Saturday for weak students', audience: 'Grade 10A', date: '1 week ago', channels: ['In-app'], type: 'Notice' },
  { id: 3, title: 'Welcome to the new academic year!', audience: 'All my classes', date: '2 weeks ago', channels: ['In-app', 'Email'], type: 'Notice' },
];

export default function TeacherCommunicationPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'notices'>('inbox');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInbox = inboxMessages.filter(m => m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || m.from.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredSent = sentNotices.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Communication</h1>
              <p className="mt-1.5 text-sm text-gray-500">Class notices and parent messages.</p>
            </div>
            <button 
              onClick={() => setIsSendModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Send Notice
            </button>
          </div>

          {/* Tabs & Search */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 border-b border-gray-200">
              {(['inbox', 'sent', 'notices'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                    activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'inbox' ? `Inbox (${inboxMessages.filter(m => m.unread).length})` : tab === 'sent' ? 'Sent' : 'Class Notices'}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search messages..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
              />
            </div>
          </div>

          {/* Content Area */}
          {activeTab === 'inbox' && (
            <div className="space-y-3">
              {filteredInbox.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4"><MessageSquare className="h-8 w-8 text-gray-400" /></div>
                  <h3 className="text-lg font-semibold text-gray-900">No messages found</h3>
                </div>
              ) : (
                filteredInbox.map((msg) => (
                  <div key={msg.id} className={`rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${msg.unread ? 'bg-white border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${msg.unread ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`text-sm font-bold ${msg.unread ? 'text-gray-900' : 'text-gray-700'}`}>{msg.from}</p>
                            {msg.unread && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
                          </div>
                          <p className="text-sm text-gray-900 mb-1">{msg.subject}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{msg.date}</span> · <span className="font-medium text-gray-600">{msg.class}</span>
                          </p>
                        </div>
                      </div>
                      <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                        <Reply className="h-3.5 w-3.5" /> Reply
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {(activeTab === 'sent' || activeTab === 'notices') && (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              {filteredSent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4"><Send className="h-8 w-8 text-gray-400" /></div>
                  <h3 className="text-lg font-semibold text-gray-900">No notices sent yet</h3>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredSent.map((notice) => (
                    <div key={notice.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <Bell className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 mb-1">{notice.title}</p>
                            <p className="text-xs text-gray-500 mb-2">Sent to: <span className="font-medium text-gray-700">{notice.audience}</span></p>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {notice.date}</span>
                              <div className="flex items-center gap-1.5">
                                {notice.channels.map((ch) => (
                                  <span key={ch} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                                    {ch === 'SMS' ? <Smartphone className="h-2.5 w-2.5" /> : ch === 'Email' ? <Mail className="h-2.5 w-2.5" /> : <Radio className="h-2.5 w-2.5" />}
                                    {ch}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ✅ Send Class Notice Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsSendModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Send Class Notice</h2>
                <p className="text-blue-100 text-sm mt-1">Broadcast to students and parents</p>
              </div>
              <button onClick={() => setIsSendModalOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input type="text" placeholder="e.g., Reminder: Unit Test 2" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea rows={4} placeholder="Write your notice here..." className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Audience</label>
                <select className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                  <option>Grade 10A Students & Parents</option>
                  <option>Grade 10B Students & Parents</option>
                  <option>Grade 9A Students & Parents</option>
                  <option>Grade 9B Students & Parents</option>
                  <option>All my classes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <Radio className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">In-app</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <Smartphone className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">SMS</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">Email</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsSendModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors">Cancel</button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                <Send className="h-4 w-4" /> Send Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}