'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Check, CircleCheck, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import PasswordAuthShell from '@/components/PasswordAuthShell';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkRecoveryLink() {
      // Capture the one-time link before Supabase initializes and removes its fragment.
      const query = new URLSearchParams(window.location.search);
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const code = query.get('code');
      const isRecovery = query.get('recovery') === '1';
      const hasRecoveryTokens = fragment.get('type') === 'recovery' &&
        Boolean(fragment.get('access_token') && fragment.get('refresh_token'));
      const linkError = query.get('error_description') || fragment.get('error_description');

      try {
        if (linkError) throw new Error(linkError);
        if (!isRecovery || (!hasRecoveryTokens && !code)) {
          throw new Error('This password reset link is invalid or has expired.');
        }

        const { supabase } = await import('@/lib/supabase');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) throw error || new Error('This password reset link has expired.');
        if (cancelled) return;

        window.history.replaceState({}, '', window.location.pathname);
        setValid(true);
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'This password reset link is invalid or has expired.');
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    void checkRecoveryLink();
    return () => { cancelled = true; };
  }, []);

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || loading) return;
    if (password.length < 8) {
      setMessage('Use at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Clear the temporary-password requirement for teacher accounts too.
      const { data } = await supabase.auth.getUser();
      if (data.user?.app_metadata?.role === 'teacher' &&
          data.user.app_metadata?.must_change_password === true) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          const response = await fetch('/api/complete-password-change', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            setMessage('Password changed. On your next teacher login, you may be asked to complete password setup.');
          }
        }
      }
      await supabase.auth.signOut();
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update your password. Request a new link and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PasswordAuthShell
      eyebrow="Secure password reset"
      title={success ? 'Password updated' : checking ? 'Checking your link' : valid ? 'Create a new password' : 'Link unavailable'}
      description={success
        ? 'Your new password is ready. Sign in to continue to your school workspace.'
        : checking ? 'We’re making sure your reset link is valid.'
          : valid ? 'Choose a password you haven’t used before to protect your NEPSOM account.'
            : 'This link could not be used. Request a new one to try again.'}
    >
      {checking ? (
        <div role="status" className="flex items-center gap-3 py-3 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> Checking your reset link…
        </div>
      ) : success ? (
        <div className="space-y-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CircleCheck className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <p role="status" className="text-sm leading-7 text-slate-600">Your password has been changed. You can now sign in with it.</p>
          {message && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">{message}</p>}
          <Link href="/auth/login" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            Go to login <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : !valid ? (
        <div className="space-y-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{message}</p>
          <Link href="/auth/forgot-password" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            Request a new link <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-blue-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /> Your reset link is verified. Set your new password below.
          </div>
          <PasswordField id="new-password" label="New password" value={password} onChange={setPassword}
            visible={showPassword} onToggle={() => setShowPassword((value) => !value)} disabled={loading} />
          <PasswordField id="confirm-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword}
            visible={showConfirmation} onToggle={() => setShowConfirmation((value) => !value)} disabled={loading} />
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <p className="flex items-center gap-2"><Check className={`h-4 w-4 ${password.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}`} /> At least 8 characters</p>
            <p className="mt-2 flex items-center gap-2"><Check className={`h-4 w-4 ${confirmPassword && password === confirmPassword ? 'text-emerald-600' : 'text-slate-400'}`} /> Both passwords match</p>
          </div>
          {message && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700"><AlertCircle className="mt-1 h-4 w-4 shrink-0" />{message}</p>}
          <button type="submit" disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating password…</> : <>Save new password <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      )}
    </PasswordAuthShell>
  );
}

function PasswordField({ id, label, value, onChange, visible, onToggle, disabled }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <KeyRound aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
        <input id={id} type={visible ? 'text' : 'password'} value={value} autoComplete="new-password"
          onChange={(event) => onChange(event.target.value)} placeholder="Enter your new password"
          minLength={8} required disabled={disabled}
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60" />
        <button type="button" onClick={onToggle} disabled={disabled}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-60">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
