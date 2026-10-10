'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Camera,
  ChevronRight,
  CircleHelp,
  Loader2,
  LockKeyhole,
  LogOut,
  Settings,
  UserRound,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  { href: '/student/profile', label: 'View Profile', icon: UserRound, active: true },
  { href: '/student/profile', label: 'Account Settings', icon: Settings },
  { href: '/auth/change-password', label: 'Change Password', icon: LockKeyhole },
  { href: '/student/notices', label: 'Notification Settings', icon: Bell },
  { href: '/student/help', label: 'Help & Support', icon: CircleHelp },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) || 'ST').toUpperCase();
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
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(avatarPath);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setCurrentPath(avatarPath), [avatarPath]);

  useEffect(() => {
    if (!open) setError('');
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

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      uploadedPath = `${userId}/${crypto.randomUUID()}.${extension}`;
      const uploaded = await supabase.storage
        .from('student-avatars')
        .upload(uploadedPath, file, { contentType: file.type, upsert: false });
      if (uploaded.error) throw uploaded.error;

      const updated = await supabase.rpc('update_my_student_avatar', {
        p_avatar_path: uploadedPath,
      });
      if (updated.error) throw updated.error;

      const signed = await supabase.storage
        .from('student-avatars')
        .createSignedUrl(uploadedPath, 3600);
      if (signed.error) throw signed.error;

      if (currentPath && currentPath !== uploadedPath) {
        await supabase.storage.from('student-avatars').remove([currentPath]);
      }
      setCurrentPath(uploadedPath);
      setPreview(null);
      onAvatarChange(signed.data.signedUrl, uploadedPath);
    } catch (cause) {
      if (uploadedPath) await supabase.storage.from('student-avatars').remove([uploadedPath]);
      setPreview(null);
      setError(cause instanceof Error ? cause.message : 'Could not upload the profile photo.');
    } finally {
      setUploading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    onClose();
    router.push('/auth/login');
    router.refresh();
  }

  const name = student?.name || fullName || 'Student';
  const grade = student?.class
    ? `Grade ${student.class}${student.section ? ` · Section ${student.section}` : ''}`
    : 'Student';
  const studentId = student?.roll_no ? `Roll No: ${student.roll_no}` : 'Student account';
  const shownAvatar = preview || avatarUrl;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Student profile menu">
      <button type="button" className="absolute inset-0 bg-slate-950/45" onClick={onClose} aria-label="Close profile menu" />
      <section className="absolute inset-x-3 bottom-3 mx-auto max-h-[calc(100dvh-24px)] max-w-md overflow-y-auto rounded-[28px] bg-white px-5 pb-5 pt-3 shadow-2xl">
        <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-300" />
        <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100" aria-label="Close profile menu">
          <X className="h-5 w-5" />
        </button>

        <div className="mt-7 flex items-center gap-4 pr-9">
          <button type="button" onClick={() => fileRef.current?.click()} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-blue-100 text-xl font-bold text-blue-700 ring-2 ring-white" aria-label="Add or change profile photo">
            {shownAvatar ? <span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${shownAvatar.replace(/"/g, '%22')}")` }} /> : initials(name)}
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadPhoto} />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-slate-950">{name}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{grade}</p>
            <p className="mt-0.5 text-sm text-slate-500">{studentId}</p>
          </div>
        </div>
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        <div className="mt-6 space-y-1">
          {items.map(({ href, label, icon: Icon, active }) => (
            <Link key={label} href={href} onClick={onClose} className={`flex min-h-14 items-center gap-4 rounded-2xl px-4 text-sm font-semibold ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-800 hover:bg-slate-50'}`}>
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Link>
          ))}
        </div>

        <div className="mt-4 border-t border-slate-200 pt-3">
          <button type="button" onClick={logout} className="flex min-h-12 w-full items-center gap-4 rounded-xl px-4 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </section>
    </div>
  );
}
