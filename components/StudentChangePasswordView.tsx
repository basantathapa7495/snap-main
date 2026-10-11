'use client';

import { FormEvent, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Props = {
  open: boolean;
  onClose: () => void;
};

type PasswordFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  autoComplete: 'current-password' | 'new-password';
  onChange: (value: string) => void;
  onToggle: () => void;
};

function PasswordField({ id, label, placeholder, value, visible, autoComplete, onChange, onToggle }: PasswordFieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-950">{label}</span>
      <span className="relative block">
        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-950 outline-none [color-scheme:light] placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
        <button type="button" onClick={onToggle} className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

export default function StudentChangePasswordView({ open, onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const requirements = [
    { label: 'Be at least 8 characters long', met: newPassword.length >= 8 },
    { label: 'Include at least one letter', met: /[A-Za-z]/.test(newPassword) },
    { label: 'Include at least one number', met: /\d/.test(newPassword) },
    { label: 'Include at least one special character', met: /[^A-Za-z0-9]/.test(newPassword) },
  ];
  const validPassword = requirements.every((item) => item.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!validPassword) {
      setError('Your new password does not meet all requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('The new passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('Choose a new password that is different from your current password.');
      return;
    }

    setSaving(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.email) throw userError || new Error('Your account email could not be found.');

      const verified = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: currentPassword,
      });
      if (verified.error) throw new Error('Your current password is incorrect.');

      const updated = await supabase.auth.updateUser({ password: newPassword });
      if (updated.error) throw updated.error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your password could not be changed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Change password">
      <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col bg-white">
        <header className="flex h-14 shrink-0 items-center border-b border-slate-100 px-3">
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-900" aria-label="Back to profile menu">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="ml-3 text-lg font-extrabold text-slate-950">Change Password</h2>
        </header>

        {success ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-5 pt-8 text-center">
            <span className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-20 w-20" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h3 className="mx-auto mt-7 max-w-[300px] text-2xl font-extrabold leading-tight text-slate-950">Password Updated Successfully!</h3>
            <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-slate-500">Your password has been changed. You can now use your new password to sign in to your account.</p>

            <div className="mt-7 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><LockKeyhole className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="text-sm font-bold text-slate-950">Security Tip</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">Keep your password private and don&apos;t share it with anyone.</p>
              </div>
            </div>

            <button type="button" onClick={onClose} className="mt-auto flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">Go Back</button>
          </div>
        ) : (
          <form onSubmit={updatePassword} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-5 pt-5">
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><ShieldCheck className="h-7 w-7" aria-hidden="true" /></span>
              <h3 className="mt-3 text-lg font-extrabold text-slate-950">Keep Your Account Secure</h3>
              <p className="mt-1 text-sm text-slate-500">Use a strong password to keep your account safe.</p>
            </div>

            <div className="mt-5 space-y-4 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
              <PasswordField id="current-password" label="Current Password" placeholder="Enter your current password" value={currentPassword} visible={visible.current} autoComplete="current-password" onChange={setCurrentPassword} onToggle={() => setVisible((state) => ({ ...state, current: !state.current }))} />
              <PasswordField id="new-password" label="New Password" placeholder="Enter new password" value={newPassword} visible={visible.next} autoComplete="new-password" onChange={setNewPassword} onToggle={() => setVisible((state) => ({ ...state, next: !state.next }))} />

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-950">Password must:</p>
                <div className="mt-2 space-y-1.5">
                  {requirements.map((requirement) => (
                    <p key={requirement.label} className={`flex items-center gap-2 text-[11px] ${requirement.met ? 'text-emerald-700' : 'text-slate-500'}`}>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${requirement.met ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>
                      {requirement.label}
                    </p>
                  ))}
                </div>
              </div>

              <PasswordField id="confirm-password" label="Confirm New Password" placeholder="Enter new password again" value={confirmPassword} visible={visible.confirm} autoComplete="new-password" onChange={setConfirmPassword} onToggle={() => setVisible((state) => ({ ...state, confirm: !state.confirm }))} />
            </div>

            {error && <p role="alert" className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700">{error}</p>}

            <button type="submit" disabled={saving || !currentPassword || !validPassword || !passwordsMatch} className="mt-5 flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {saving ? 'Updating Password…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
