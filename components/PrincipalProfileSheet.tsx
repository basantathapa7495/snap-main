'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Building2,
  ChevronRight,
  Loader2,
  LockKeyhole,
  LogOut,
  Settings,
  UserRound,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Props = {
  open: boolean;
  onClose: () => void;
  fullName: string;
  avatarUrl: string | null;
};

const items = [
  { href: '/principal/account/profile', label: 'View Profile', icon: UserRound, active: true },
  { href: '/principal/account/school', label: 'School Account', icon: Building2 },
  { href: '/principal/account/security', label: 'Login & Security', icon: LockKeyhole },
  { href: '/principal/account/notifications', label: 'Notifications', icon: Bell },
  { href: '/principal/settings', label: 'Settings & Preferences', icon: Settings },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) || 'PR').toUpperCase();
}

export default function PrincipalProfileSheet({ open, onClose, fullName, avatarUrl }: Props) {
  const [loggingOut, setLoggingOut] = useState(false);
  if (!open) return null;

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoggingOut(false);
      return;
    }
    window.location.replace('/auth/login?role=principal');
  }

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Principal account menu">
      <button type="button" className="absolute inset-0 bg-slate-900/25 backdrop-blur-[1px]" onClick={onClose} aria-label="Close account menu" />
      <section className="absolute right-3 top-[4.25rem] max-h-[calc(100dvh-5.25rem)] w-[min(300px,calc(100vw-24px))] overflow-y-auto rounded-[22px] border border-white/80 bg-white px-3.5 pb-3 pt-3.5 shadow-[0_22px_60px_rgba(15,23,42,0.24)]">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200" aria-label="Close account menu">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 pr-10">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-base font-bold text-blue-700 ring-[3px] ring-white shadow-md">
            {avatarUrl ? (
              <span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${avatarUrl.replace(/"/g, '%22')}")` }} aria-hidden="true" />
            ) : initials(fullName)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-extrabold text-slate-950">{fullName || 'Principal'}</h2>
            <span className="mt-1 inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">Principal</span>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          {items.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex min-h-[43px] items-center gap-2.5 rounded-xl border px-2.5 text-[13px] font-bold text-slate-950 transition-colors ${active ? 'border-blue-100 bg-blue-50 hover:bg-blue-100' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-950'}`}>
                <Icon className="h-[17px] w-[17px]" />
              </span>
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            </Link>
          ))}
        </div>

        <div className="mt-2.5 border-t border-slate-200 pt-2.5">
          <button type="button" onClick={() => void logout()} disabled={loggingOut} className="flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-3 text-left text-[13px] font-bold text-red-600 hover:bg-red-100 disabled:cursor-wait disabled:opacity-70">
            {loggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
            <span className="flex-1">{loggingOut ? 'Logging out…' : 'Logout'}</span>
            <ChevronRight className="h-5 w-5 text-red-400" />
          </button>
        </div>
      </section>
    </div>
  );
}
