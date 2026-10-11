'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  BellRing,
  CalendarDays,
  Check,
  ClipboardList,
  Folder,
  Mail,
  Megaphone,
  Save,
  School,
} from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

const options = [
  { key: 'notices', label: 'Notices & Announcements', description: 'New school notices and important announcements.', icon: Megaphone },
  { key: 'assignments', label: 'Assignments', description: 'New assignments and approaching due dates.', icon: ClipboardList },
  { key: 'exams', label: 'Exams & Results', description: 'Exam schedules and published results.', icon: BarChart3 },
  { key: 'documents', label: 'Documents', description: 'New documents shared with you.', icon: Folder },
  { key: 'timetable', label: 'Timetable Updates', description: 'Changes to class timetable or schedule.', icon: CalendarDays },
  { key: 'school', label: 'School Updates', description: 'Other important school-related updates.', icon: School },
] as const;

type PreferenceKey = (typeof options)[number]['key'] | 'email';
type Preferences = Record<PreferenceKey, boolean>;

const initialPreferences: Preferences = {
  notices: true,
  assignments: true,
  exams: true,
  documents: true,
  timetable: true,
  school: false,
  email: true,
};

function Switch({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={`${label}: ${checked ? 'on' : 'off'}`} onClick={onChange} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function StudentNotificationSettingsView({ open, onClose }: Props) {
  const [preferences, setPreferences] = useState<Preferences>(initialPreferences);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  function toggle(key: PreferenceKey) {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  }

  function closeView() {
    setSaved(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Notification settings">
      <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col bg-white">
        <header className="flex h-14 shrink-0 items-center border-b border-slate-100 px-3">
          <button type="button" onClick={closeView} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-900" aria-label="Back to profile menu"><ArrowLeft className="h-5 w-5" /></button>
          <h2 className="ml-3 text-lg font-extrabold text-slate-950">Notification Settings</h2>
        </header>

        {saved ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-5 pt-8 text-center">
            <span className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="relative"><BellRing className="h-20 w-20" strokeWidth={1.6} aria-hidden="true" /><span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white ring-4 ring-blue-50"><Check className="h-5 w-5" strokeWidth={3} /></span></span>
            </span>
            <h3 className="mt-6 text-2xl font-extrabold text-slate-950">Settings Saved!</h3>
            <p className="mx-auto mt-2 max-w-[310px] text-sm leading-6 text-slate-500">Your notification choices have been updated for this preview.</p>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-white px-3 shadow-sm">
              {[...options, { key: 'email' as const, label: 'Email Notifications', description: '', icon: Mail }].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex min-h-11 items-center gap-2 border-b border-slate-100 last:border-b-0">
                  <Icon className="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-left text-xs font-medium text-slate-800">{label}</span>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${preferences[key] ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{preferences[key] ? 'On' : 'Off'}</span>
                </div>
              ))}
            </div>

            <button type="button" onClick={closeView} className="mt-auto flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700"><ArrowLeft className="h-4 w-4" />Back to Profile</button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3.5 pb-5 pt-4">
            <p className="text-sm leading-5 text-slate-500">Choose what notifications you want to receive from your school.</p>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-white px-3 shadow-sm">
              {options.map(({ key, label, description, icon: Icon }) => (
                <div key={key} className="flex min-h-[72px] items-center gap-3 border-b border-slate-100 last:border-b-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-800"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-950">{label}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{description}</p>
                  </div>
                  <Switch checked={preferences[key]} label={label} onChange={() => toggle(key)} />
                </div>
              ))}
            </div>

            <div className="mt-3 flex min-h-[72px] items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-800"><Mail className="h-5 w-5" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-950">Email Notifications</p><p className="mt-0.5 text-[11px] leading-4 text-slate-500">Receive important updates by email.</p></div>
              <Switch checked={preferences.email} label="Email Notifications" onChange={() => toggle('email')} />
            </div>

            <button type="button" onClick={() => setSaved(true)} className="mt-4 flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700"><Save className="h-4 w-4" aria-hidden="true" />Save Settings</button>
          </div>
        )}
      </div>
    </div>
  );
}
