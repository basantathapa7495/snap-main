'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  CircleHelp,
  Contact,
  GraduationCap,
  Loader2,
  LockKeyhole,
  LogOut,
  Pencil,
  Settings,
  UserRound,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StudentProfileView from './StudentProfileView';

type StudentSummary = {
  name: string;
  class: string | null;
  section: string | null;
  roll_no: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  fullName: string;
  avatarPath: string | null;
  avatarUrl: string | null;
  student: StudentSummary | null;
  onAvatarChange: (url: string, path: string) => void;
};

const items = [
  { href: '/student/profile', label: 'View Profile', icon: UserRound },
  { href: '/student/profile', label: 'Account Settings', icon: Settings },
  { href: '/auth/change-password', label: 'Change Password', icon: LockKeyhole },
  { href: '/student/notices', label: 'Notification Settings', icon: Bell },
  { href: '/student/help', label: 'Help & Support', icon: CircleHelp },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) || 'ST').toUpperCase();
}

async function optimizeAvatar(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const maxSize = 512;
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');

    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.78);
    });

    if (!blob || blob.size >= file.size) return file;
    return new File([blob], 'avatar.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}

export default function StudentProfileSheet({
  open,
  onClose,
  userId,
  fullName,
  avatarPath,
  avatarUrl,
  student,
  onAvatarChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(avatarPath);
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setCurrentPath(avatarPath), [avatarPath]);

  useEffect(() => {
    if (!open) {
      setError('');
      setConfirmLogout(false);
      setViewProfileOpen(false);
    }
  }, [open]);

  useEffect(() => () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
  }, [preview]);

  if (!open) return null;

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile photo must be smaller than 2 MB.');
      return;
    }

    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    setError('');
    let uploadedPath = '';
    let profileUpdated = false;

    try {
      const uploadFile = await optimizeAvatar(file);
      const extension = uploadFile.type === 'image/webp'
        ? 'webp'
        : uploadFile.type === 'image/png' ? 'png' : 'jpg';
      uploadedPath = `${userId}/${crypto.randomUUID()}.${extension}`;
      const uploaded = await supabase.storage
        .from('student-avatars')
        .upload(uploadedPath, uploadFile, { contentType: uploadFile.type, cacheControl: '3600', upsert: false });
      if (uploaded.error) throw uploaded.error;

      const updated = await supabase.rpc('update_my_student_avatar', {
        p_avatar_path: uploadedPath,
      });
      if (updated.error) throw updated.error;

      profileUpdated = true;
      setCurrentPath(uploadedPath);
      onAvatarChange(localPreview, uploadedPath);

      const signed = await supabase.storage
        .from('student-avatars')
        .createSignedUrl(uploadedPath, 3600);
      if (signed.error) throw signed.error;

      if (currentPath && currentPath !== uploadedPath) {
        await supabase.storage.from('student-avatars').remove([currentPath]);
      }
      setPreview(null);
      onAvatarChange(signed.data.signedUrl, uploadedPath);
    } catch (cause) {
      if (!profileUpdated) {
        if (uploadedPath) await supabase.storage.from('student-avatars').remove([uploadedPath]);
        setPreview(null);
        setError(cause instanceof Error ? cause.message : 'Could not upload the profile photo.');
      } else {
        setError('Your photo was saved. Its preview may take a moment to refresh.');
      }
    } finally {
      setUploading(false);
    }
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setError('');

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message || 'Could not log out. Please try again.');
      setLoggingOut(false);
      return;
    }

    onClose();
    window.location.replace('/auth/login?role=student');
  }

  const name = student?.name || fullName || 'Student';
  const grade = student?.class
    ? `Grade ${student.class}${student.section ? ` · Section ${student.section}` : ''}`
    : 'Student';
  const studentId = student?.roll_no ? `Roll No: ${student.roll_no}` : 'Student account';
  const shownAvatar = preview || avatarUrl;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Student profile menu">
      <button type="button" className="absolute inset-0 bg-slate-900/25" onClick={onClose} aria-label="Close profile menu" />
      <section className="absolute right-3 top-[4.25rem] max-h-[calc(100dvh-5.25rem)] w-[min(300px,calc(100vw-24px))] overflow-y-auto rounded-[22px] border border-white/80 bg-white px-3.5 pb-3 pt-3.5 shadow-[0_22px_60px_rgba(15,23,42,0.24)]">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200" aria-label="Close profile menu">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 pr-7">
          <div className="relative h-14 w-14 shrink-0">
            <button type="button" onClick={() => fileRef.current?.click()} className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-base font-bold text-blue-700 ring-[3px] ring-white shadow-md" aria-label="Preview or change profile photo">
              {shownAvatar ? <span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${shownAvatar.replace(/"/g, '%22')}")` }} /> : initials(name)}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-white bg-slate-200 text-slate-950 shadow-md hover:bg-slate-300 disabled:cursor-wait" aria-label="Edit profile photo">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadPhoto} />
          <div className="min-w-0">
            <h2 className="truncate text-base font-extrabold text-slate-950">{name}</h2>
            <p className="mt-0.5 flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-900"><GraduationCap className="h-3.5 w-3.5" />{grade}</p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] font-medium text-slate-600"><Contact className="h-3.5 w-3.5" />{studentId}</p>
          </div>
        </div>
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        <div className="mt-3 space-y-1.5">
          {items.map(({ href, label, icon: Icon }, index) => index === 0 ? (
            <button key={label} type="button" onClick={() => setViewProfileOpen(true)} className="flex min-h-[43px] w-full items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-2.5 text-left text-[13px] font-bold text-slate-950 transition-colors hover:bg-blue-100">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${index === 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-950'}`}><Icon className="h-[17px] w-[17px]" /></span>
              <span className="flex-1">{label}</span>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>
          ) : (
            <Link key={label} href={href} onClick={onClose} className="flex min-h-[43px] items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 text-[13px] font-bold text-slate-950 transition-colors hover:bg-slate-50">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-950"><Icon className="h-[17px] w-[17px]" /></span>
              <span className="flex-1">{label}</span>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Link>
          ))}
        </div>

        <div className="mt-2.5 border-t border-slate-200 pt-2.5">
          <button type="button" onClick={() => setConfirmLogout(true)} disabled={loggingOut} className="flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-3 text-left text-[13px] font-bold text-red-600 hover:bg-red-100 disabled:cursor-wait disabled:opacity-70">
            {loggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
            <span className="flex-1">{loggingOut ? 'Logging out…' : 'Logout'}</span>
            <ChevronRight className="h-5 w-5 text-red-400" />
          </button>
        </div>
      </section>

      {confirmLogout && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/25 px-6" role="alertdialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-description">
          <div className="w-full max-w-[290px] rounded-2xl bg-white p-5 text-center shadow-[0_22px_60px_rgba(15,23,42,0.28)]">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h3 id="logout-title" className="mt-3 text-base font-extrabold text-slate-950">Logout from NEPSOM?</h3>
            <p id="logout-description" className="mt-1.5 text-xs leading-5 text-slate-500">You will need to sign in again to access the student portal.</p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button type="button" onClick={() => setConfirmLogout(false)} disabled={loggingOut} className="min-h-10 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">No</button>
              <button type="button" onClick={logout} disabled={loggingOut} className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-70">
                {loggingOut && <Loader2 className="h-4 w-4 animate-spin" />}
                {loggingOut ? 'Logging out…' : 'Yes, Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
      <StudentProfileView open={viewProfileOpen} onClose={() => setViewProfileOpen(false)} userId={userId} avatarUrl={shownAvatar} />
    </div>
  );
}
