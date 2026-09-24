'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, CircleCheck, Loader2, Mail } from 'lucide-react';
import PasswordAuthShell from '@/components/PasswordAuthShell';
import { supabase } from '@/lib/supabase';

const RESET_URL = 'https://nepsom.xyz/auth/reset-password?recovery=1';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: RESET_URL,
      });
      if (error) throw error;
      setSent(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not send a reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PasswordAuthShell
      eyebrow="Account recovery"
      title={sent ? 'Check your inbox' : 'Forgot your password?'}
      description={sent
        ? 'We have sent instructions if this email belongs to a NEPSOM account.'
        : 'Enter the email address you use for NEPSOM and we’ll send you a secure reset link.'}
    >
      {sent ? (
        <div className="space-y-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CircleCheck className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <div role="status" className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-emerald-900">
            If <strong className="break-all">{email.trim()}</strong> has an account, a link will arrive shortly. Check your spam folder too.
          </div>
          <p className="text-sm leading-6 text-slate-500">Open the newest email and follow its link to create a new password.</p>
          <button type="button" onClick={() => { setSent(false); setErrorMessage(''); }}
            className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label htmlFor="recovery-email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
            <div className="relative">
              <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input id="recovery-email" type="email" inputMode="email" autoComplete="email"
                value={email} onChange={(event) => setEmail(event.target.value)}
                placeholder="you@school.edu.np" required disabled={loading}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60" />
            </div>
          </div>
          {errorMessage && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {errorMessage}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending reset link…</> : <>Send reset link <ArrowRight className="h-4 w-4" /></>}
          </button>
          <p className="text-center text-xs leading-5 text-slate-500">Only a person with access to your email can use the reset link.</p>
        </form>
      )}
      <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
        Remember your password?{' '}
        <Link href="/auth/login" className="font-semibold text-blue-700 hover:text-blue-800">Sign in</Link>
      </div>
    </PasswordAuthShell>
  );
}
