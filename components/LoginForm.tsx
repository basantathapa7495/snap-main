'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'principal';
  const schoolSlug = searchParams.get('school') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🎨 Dynamic Role Config
  const config: any = {
    teacher: { 
      title: 'Teacher Login', 
      icon: '👩‍🏫', 
      bg: 'bg-blue-50', 
      text: 'text-blue-700', 
      btn: 'bg-blue-600 hover:bg-blue-700',
      border: 'border-blue-200',
      desc: 'Manage attendance, marks, and classes' 
    },
    student: { 
      title: 'Student Login', 
      icon: '👨‍🎓', 
      bg: 'bg-green-50', 
      text: 'text-green-700', 
      btn: 'bg-green-600 hover:bg-green-700',
      border: 'border-green-200',
      desc: 'Check your results, fees, and attendance' 
    },
    principal: { 
      title: 'Principal Login', 
      icon: '👑', 
      bg: 'bg-indigo-50', 
      text: 'text-indigo-700', 
      btn: 'bg-indigo-600 hover:bg-indigo-700',
      border: 'border-indigo-200',
      desc: 'Manage your entire school dashboard' 
    }
  }[role] || { title: 'Login', icon: '🔐', bg: 'bg-gray-50', text: 'text-gray-700', btn: 'bg-gray-600 hover:bg-gray-700', border: 'border-gray-200', desc: 'Welcome back' };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Redirect based on role
    if (role === 'teacher') {
      router.push('/teacher');
    } else if (role === 'student') {
      router.push('/student');
    } else {
      router.push('/principal');
    }
  }

  return (
    <div className={`w-full max-w-md rounded-2xl border ${config.border} ${config.bg} p-8 shadow-xl`}>
      <div className="text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-4xl shadow-md ${config.text}`}>
          {config.icon}
        </div>
        <h1 className={`mt-4 text-2xl font-bold ${config.text}`}>{config.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{config.desc}</p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@school.com"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg ${config.btn} py-3 font-semibold text-white shadow-md transition disabled:opacity-50`}
        >
          {loading ? '⏳ Logging in...' : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
        </button>
      </form>

      {role === 'principal' && (
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have a school website yet?{' '}
          <Link href="/auth/signup" className="font-semibold text-indigo-600 hover:text-indigo-800">
            Create one free →
          </Link>
        </p>
      )}

      {schoolSlug && (
        <div className="mt-6 border-t border-gray-200 pt-4 text-center">
          <Link href={`/s/${schoolSlug}/login`} className="text-sm text-gray-500 hover:text-gray-700">
            ← Choose a different role
          </Link>
        </div>
      )}
    </div>
  );
}