'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

        // Dynamic import ensures the URL is inspected before the shared client
        // automatically handles the fragment from the recovery email.
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

      // A teacher who replaces a temporary password via email has finished
      // the same setup step as a teacher using the in-app change form.
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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">NEPSOM</h1>
          <p className="mt-2 text-gray-600">Create a new password</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {checking ? (
            <p role="status" className="text-center text-gray-600">Checking your reset link...</p>
          ) : success ? (
            <div className="text-center">
              <p role="status" className="text-green-700">Password updated. You can now sign in with your new password.</p>
              {message && <p className="mt-3 text-sm text-amber-700">{message}</p>}
              <Link href="/auth/login" className="mt-6 inline-block font-medium text-blue-600 hover:text-blue-700">Go to login</Link>
            </div>
          ) : !valid ? (
            <div className="text-center">
              <p role="alert" className="text-red-600">{message}</p>
              <Link href="/auth/forgot-password" className="mt-6 inline-block font-medium text-blue-600 hover:text-blue-700">Request a new reset link</Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">New password</label>
                <input id="password" type="password" value={password} autoComplete="new-password"
                  onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters"
                  minLength={8} required disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">Confirm new password</label>
                <input id="confirmPassword" type="password" value={confirmPassword} autoComplete="new-password"
                  onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-blue-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Updating...' : 'Update password'}
              </button>
              {message && <p role="alert" className="text-center text-sm text-red-600">{message}</p>}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
