'use client';

import { useState } from 'react';
import { 
  Settings, Globe, Users, GraduationCap, MessageSquare, Cake, 
  Bell, Mail, Smartphone, Shield, Lock, Save, Check, BookOpen,
  Percent, Award
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Reusable Toggle Switch Component ---
function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [isSaved, setIsSaved] = useState(false);

  // Feature Toggles State
  const [features, setFeatures] = useState({
    onlineAdmissions: true,
    publicWebsite: true,
    studentPortal: true,
    teacherPortal: true,
    smsNotifications: false,
    birthdayAlerts: true,
  });

  // Notification Toggles State
  const [notifications, setNotifications] = useState({
    emailOnFeePayment: true,
    smsOnAbsence: true,
    dailyDigest: false,
    newNoticeAlert: true,
  });

  // Academic Preferences State
  const [academics, setAcademics] = useState({
    gradingSystem: 'gpa',
    passMark: '40',
    attendanceMethod: 'daily',
  });

  const updateFeature = (key: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    // In real app: Save to Supabase 'schools' table or a new 'settings' table
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        
        {/* ✅ Using pt-24 as requested */}
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Settings & Preferences</h1>
              <p className="mt-1.5 text-sm text-gray-500">Configure your school's features, notifications, and academic rules.</p>
            </div>
            <button 
              onClick={handleSave}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${
                isSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSaved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
            </button>
          </div>

          <div className="space-y-8 max-w-5xl">
            
            {/* ✅ 1. Feature Toggles */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Feature Toggles</h2>
                  <p className="text-xs text-gray-500">Turn specific modules on or off for your school.</p>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {/* Online Admissions */}
                <div className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 flex-shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Online Admissions</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Allow parents to submit admission applications via the public website.</p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={features.onlineAdmissions} onChange={() => updateFeature('onlineAdmissions')} />
                </div>

                {/* Public Website */}
                <div className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Public Website Visibility</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Make your school's public website visible to everyone on the internet.</p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={features.publicWebsite} onChange={() => updateFeature('publicWebsite')} />
                </div>

                {/* Student Portal */}
                <div className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 flex-shrink-0">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Student Portal Access</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Allow students to log in and view their attendance, fees, and grades.</p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={features.studentPortal} onChange={() => updateFeature('studentPortal')} />
                </div>

                {/* Teacher Portal */}
                <div className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 flex-shrink-0">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Teacher Portal Access</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Allow teachers to log in, mark attendance, and enter exam marks.</p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={features.teacherPortal} onChange={() => updateFeature('teacherPortal')} />
                </div>

                {/* SMS Notifications */}
                <div className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50 text-pink-600 flex-shrink-0">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">SMS Notifications</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Send automated SMS alerts to parents (Requires SMS credit balance).</p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={features.smsNotifications} onChange={() => updateFeature('smsNotifications')} />
                </div>

                {/* Birthday Alerts */}
                <div className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 flex-shrink-0">
                      <Cake className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Birthday Alerts</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Show daily birthday notifications on the principal dashboard.</p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={features.birthdayAlerts} onChange={() => updateFeature('birthdayAlerts')} />
                </div>
              </div>
            </div>

            {/* ✅ 2. Academic Preferences */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Academic Preferences</h2>
                  <p className="text-xs text-gray-500">Set rules for grading and attendance calculation.</p>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Grading System</label>
                  <select 
                    value={academics.gradingSystem}
                    onChange={(e) => setAcademics(prev => ({ ...prev, gradingSystem: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    <option value="gpa">GPA (Grade Point Average)</option>
                    <option value="percentage">Percentage Only</option>
                    <option value="both">Both GPA & Percentage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Pass Mark (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="number" 
                      value={academics.passMark}
                      onChange={(e) => setAcademics(prev => ({ ...prev, passMark: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Attendance Calculation Method</label>
                  <select 
                    value={academics.attendanceMethod}
                    onChange={(e) => setAcademics(prev => ({ ...prev, attendanceMethod: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    <option value="daily">Daily (Present/Absent)</option>
                    <option value="period">Period-wise (Per Class)</option>
                    <option value="hybrid">Hybrid (Daily + Period)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ✅ 3. Notification Preferences */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Notification Preferences</h2>
                  <p className="text-xs text-gray-500">Control what alerts are sent to parents and staff.</p>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Email receipt on fee payment</span>
                  </div>
                  <ToggleSwitch enabled={notifications.emailOnFeePayment} onChange={() => updateNotification('emailOnFeePayment')} />
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">SMS alert when student is absent</span>
                  </div>
                  <ToggleSwitch enabled={notifications.smsOnAbsence} onChange={() => updateNotification('smsOnAbsence')} />
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Send daily digest email to principal</span>
                  </div>
                  <ToggleSwitch enabled={notifications.dailyDigest} onChange={() => updateNotification('dailyDigest')} />
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Notify parents when new notice is published</span>
                  </div>
                  <ToggleSwitch enabled={notifications.newNoticeAlert} onChange={() => updateNotification('newNoticeAlert')} />
                </div>
              </div>
            </div>

            {/* ✅ 4. Security */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Security</h2>
                  <p className="text-xs text-gray-500">Manage your account security and passwords.</p>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <button className="w-full flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-gray-500" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">Change Password</p>
                      <p className="text-xs text-gray-500">Update your login credentials</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600">Update →</span>
                </button>
                
                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-500" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">Two-Factor Authentication (2FA)</p>
                      <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-1 text-[10px] font-bold text-gray-600">Coming Soon</span>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}