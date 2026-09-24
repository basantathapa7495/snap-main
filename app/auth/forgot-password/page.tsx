'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const RESET_URL = 'https://nepsom.xyz/auth/reset-password?recovery=1';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: RESET_URL,
      });
      if (error) throw error;
      setMessage('If this email has a NEPSOM account, a password reset link will arrive shortly. Check your spam folder too.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not send a reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">NEPSOM</h1>
          <p className="mt-2 text-gray-600">Reset your password</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input id="email" type="email" autoComplete="email" value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com" required disabled={loading}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Sending...' : 'Send reset email'}
            </button>
          </form>
          {message && <p role="status" className="mt-5 text-center text-sm text-green-700">{message}</p>}
          {errorMessage && <p role="alert" className="mt-5 text-center text-sm text-red-700">{errorMessage}</p>}
          <p className="mt-6 text-center text-sm text-gray-600">
            Remember your password?{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-700">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
