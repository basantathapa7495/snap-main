'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
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
      <button type="button" className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" onClick={onClose} aria-label="Close profile menu" />
      <section className="absolute right-3 top-[4.25rem] max-h-[calc(100dvh-5.25rem)] w-[min(300px,calc(100vw-24px))] overflow-y-auto rounded-[22px] border border-white/80 bg-white px-3.5 pb-3.5 pt-4 shadow-[0_22px_60px_rgba(15,23,42,0.24)]">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200" aria-label="Close profile menu">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 pr-7">
          <div className="relative h-16 w-16 shrink-0">
            <button type="button" onClick={() => fileRef.current?.click()} className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-lg font-bold text-blue-700 ring-[3px] ring-white shadow-md" aria-label="Preview or change profile photo">
              {shownAvatar ? <span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${shownAvatar.replace(/"/g, '%22')}")` }} /> : initials(name)}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-slate-200 text-slate-950 shadow-md hover:bg-slate-300 disabled:cursor-wait" aria-label="Edit profile photo">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadPhoto} />
          <div className="min-w-0">
            <h2 className="truncate text-base font-extrabold text-slate-950">{name}</h2>
            <p className="mt-1 flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900"><GraduationCap className="h-4 w-4" />{grade}</p>
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-medium text-slate-600"><Contact className="h-4 w-4" />{studentId}</p>
          </div>
        </div>
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        <div className="mt-4 space-y-2">
          {items.map(({ href, label, icon: Icon }, index) => (
            <Link key={label} href={href} onClick={onClose} className={`flex min-h-[50px] items-center gap-2.5 rounded-xl border px-2.5 text-[13px] font-bold text-slate-950 transition-colors ${index === 0 ? 'border-blue-100 bg-blue-50 hover:bg-blue-100' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${index === 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-950'}`}><Icon className="h-[18px] w-[18px]" /></span>
              <span className="flex-1">{label}</span>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Link>
          ))}
        </div>

        <div className="mt-3 border-t border-slate-200 pt-3">
          <button type="button" onClick={logout} className="flex min-h-[50px] w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-3 text-left text-[13px] font-bold text-red-600 hover:bg-red-100">
            <LogOut className="h-5 w-5" />
            <span className="flex-1">Logout</span>
            <ChevronRight className="h-5 w-5 text-red-400" />
          </button>
        </div>
      </section>
    </div>
  );
}
