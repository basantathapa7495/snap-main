'use client';

import { useState } from 'react';
import { 
  Plus, Send, Clock, FileText, Trash2, Edit3, Eye, 
  Bell, Smartphone, Mail, Monitor, X, CheckCircle, AlertCircle
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Mock Data ---
const mockNotices = [
  { id: 1, title: 'Parent-Teacher Meeting', message: 'Dear parents, the PTM is scheduled for this Saturday...', audience: 'Entire School', channels: ['In-app', 'SMS'], status: 'Sent', date: 'Oct 24, 2023' },
  { id: 2, title: 'Dashain Holiday Notice', message: 'The school will remain closed from...', audience: 'Entire School', channels: ['In-app', 'Notice board'], status: 'Scheduled', date: 'Oct 28, 2023' },
  { id: 3, title: 'Science Fair Registration', message: 'Students interested in the science fair...', audience: 'Students', channels: ['In-app'], status: 'Draft', date: 'Oct 20, 2023' },
];

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState('Sent');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('Entire School');
  const [channels, setChannels] = useState({
    inApp: true,
    sms: false,
    email: false,
    noticeBoard: true,
  });

  const toggleChannel = (key: keyof typeof channels) => {
    setChannels(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSend = () => {
    alert(`Notice "${title}" sent to ${audience} via ${Object.entries(channels).filter(([,v]) => v).map(([k]) => k).join(', ')}!`);
    setIsModalOpen(false);
    // Reset form
    setTitle(''); setMessage(''); setAudience('Entire School');
  };

  const filteredNotices = mockNotices.filter(n => n.status === activeTab);

  const getStatusBadge = (status: string) => {
    if (status === 'Sent') return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200"><CheckCircle className="h-3 w-3" /> Sent</span>;
    if (status === 'Scheduled') return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200"><Clock className="h-3 w-3" /> Scheduled</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 border border-gray-200"><FileText className="h-3 w-3" /> Draft</span>;
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Communication</h1>
              <p className="mt-1.5 text-sm text-gray-500">Send notices, announcements, and alerts to your school community.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create Notice
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-3">
            {['Sent', 'Scheduled', 'Drafts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {tab} {tab !== 'Drafts' && `(${mockNotices.filter(n => n.status === tab).length})`}
              </button>
            ))}
          </div>

          {/* Notices List */}
          {filteredNotices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No {activeTab.toLowerCase()} notices</h3>
              <p className="mt-1 text-sm text-gray-500">Create a new notice to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotices.map((notice) => (
                <div key={notice.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{notice.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notice.message}</p>
                      </div>
                    </div>
                    {getStatusBadge(notice.status)}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5 font-medium text-gray-700">
                      👥 {notice.audience}
                    </span>
                    <span className="flex items-center gap-1.5">
                      📡 {notice.channels.join(', ')}
                    </span>
                    <span className="ml-auto flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> {notice.date}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4">
                    <button className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors">
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors">
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 border border-red-100 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ✅ Create Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Create New Notice</h2>
                <p className="text-blue-100 text-sm mt-1">Broadcast messages to your school community.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notice Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Parent-Teacher Meeting this Saturday" 
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your announcement here..." 
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" 
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{message.length} characters</p>
              </div>

              {/* Audience Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Audience</label>
                <select 
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                >
                  <option value="Entire School">Entire School</option>
                  <option value="Students">All Students</option>
                  <option value="Teachers">All Teachers</option>
                  <option value="Parents">All Parents</option>
                  <option value="Class 10">Specific Class: Class 10</option>
                  <option value="Class 9">Specific Class: Class 9</option>
                </select>
              </div>

              {/* Channels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Channels</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${channels.inApp ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={channels.inApp} onChange={() => toggleChannel('inApp')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <Monitor className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">In-App Notification</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${channels.sms ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={channels.sms} onChange={() => toggleChannel('sms')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <Smartphone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">SMS Message</span>
                  </label>

                  <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${channels.email ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={channels.email} onChange={() => toggleChannel('email')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Email</span>
                  </label>

                  <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${channels.noticeBoard ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={channels.noticeBoard} onChange={() => toggleChannel('noticeBoard')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <Bell className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Notice Board</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="border-t border-gray-100 p-4 bg-gray-50 flex flex-col sm:flex-row justify-between gap-3">
              <button 
                onClick={() => { alert('Saved as draft!'); setIsModalOpen(false); }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-4 w-4" /> Save Draft
              </button>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { alert('Scheduled for later!'); setIsModalOpen(false); }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Clock className="h-4 w-4" /> Schedule
                </button>
                <button 
                  onClick={handleSend}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <Send className="h-4 w-4" /> Send Now
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}