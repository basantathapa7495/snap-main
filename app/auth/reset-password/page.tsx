'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setMessage(
          '❌ This password reset link is invalid or has expired.'
        );
      }

      setChecking(false);
    }

    checkSession();
  }, []);

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      setMessage('❌ Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('❌ Passwords do not match.');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(`❌ ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage('✅ Password updated successfully!');

    setTimeout(() => {
      router.push('/auth/login');
    }, 1500);
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Checking reset link...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            snap
          </h1>

          <p className="mt-2 text-gray-600">
            Create a new password
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          {message.includes('invalid') ? (
            <>
              <p className="text-center text-red-600">
                {message}
              </p>

              <a
                href="/auth/forgot-password"
                className="mt-6 block text-center font-medium text-blue-600 hover:text-blue-700"
              >
                Request a new reset link
              </a>
            </>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">

              {/* New Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter password again"
                  minLength={6}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              {/* Update */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>

              {message && (
                <p className="text-center text-sm font-medium">
                  {message}
                </p>
              )}

            </form>
          )}

        </div>
      </div>
    </main>
  );
}