'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export default function LoginGenerator({ 
  personId, 
  personName, 
  personEmail,
  role,
  schoolId,
  onCreated 
}: { 
  personId: string; 
  personName: string;
  personEmail?: string;
  role: 'teacher' | 'student';
  schoolId: string;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState('');

  async function createLogin() {
    setLoading(true);
    setError('');

    try {
      // Generate email if not provided
      const email = personEmail || `${personName.toLowerCase().replace(/\s+/g, '.')}@school.com`;
      
      // Generate simple password: Name@Year (e.g., Sita@2026)
      const firstName = personName.split(' ')[0];
      const year = new Date().getFullYear();
      const password = `${firstName}@${year}`;

      // Create auth user using service role (bypasses RLS)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: personName,
            role: role,
            school_id: schoolId
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Link to person record
      const table = role === 'teacher' ? 'teachers' : 'students';
      const { error: linkError } = await supabase
        .from(table)
        .update({ user_id: authData.user.id })
        .eq('id', personId);

      if (linkError) throw linkError;

      setCredentials({ email, password });
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create login');
    } finally {
      setLoading(false);
    }
  }

  if (credentials) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✅
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Login Created!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Share these credentials with <strong>{personName}</strong>
            </p>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
              <p className="mt-1 font-mono text-sm text-gray-900 break-all">{credentials.email}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Password</p>
              <p className="mt-1 font-mono text-sm text-gray-900">{credentials.password}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `Email: ${credentials.email}\nPassword: ${credentials.password}`
                );
                alert('Credentials copied to clipboard!');
              }}
              className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
            >
              📋 Copy Credentials
            </button>
            <button
              onClick={() => setCredentials(null)}
              className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">
            💡 They can change their password after first login
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={createLogin}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '⏳ Creating...' : '🔑 Create Login'}
      </button>
      {error && (
        <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}
    </>
  );
}