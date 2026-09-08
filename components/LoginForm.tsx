'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';

import {
  GraduationCap,
  UserRound,
  ShieldCheck,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';

type PortalRole = 'principal' | 'teacher' | 'student';

type RoleConfig = {
  title: string;
  description: string;
  icon: React.ElementType;
  iconContainer: string;
  iconColor: string;
  button: string;
  focusRing: string;
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedRole =
    (searchParams.get('role') as PortalRole | null) || 'principal';

  const schoolSlug = searchParams.get('school') || '';

  const role: PortalRole =
    requestedRole === 'teacher' ||
    requestedRole === 'student' ||
    requestedRole === 'principal'
      ? requestedRole
      : 'principal';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  // =========================================================
  // ROLE CONFIG
  // =========================================================

  const roleConfig: Record<PortalRole, RoleConfig> = {
    principal: {
      title: 'Principal Portal',
      description:
        'Manage your school, teachers, students and administration.',
      icon: ShieldCheck,
      iconContainer: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      button:
        'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500/20',
      focusRing:
        'focus:border-indigo-500 focus:ring-indigo-500/10',
    },

    teacher: {
      title: 'Teacher Portal',
      description:
        'Manage classes, attendance, marks and assignments.',
      icon: GraduationCap,
      iconContainer: 'bg-blue-50',
      iconColor: 'text-blue-600',
      button:
        'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20',
      focusRing:
        'focus:border-blue-500 focus:ring-blue-500/10',
    },

    student: {
      title: 'Student Portal',
      description:
        'View attendance, results, fees, notices and school activity.',
      icon: UserRound,
      iconContainer: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      button:
        'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/20',
      focusRing:
        'focus:border-emerald-500 focus:ring-emerald-500/10',
    },
  };

  const config = roleConfig[role];

  const RoleIcon = config.icon;

  // =========================================================
  // LOGIN
  // =========================================================

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // -------------------------------------------------------
      // 1. Authenticate
      // -------------------------------------------------------

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError('Unable to sign in. Please try again.');
        return;
      }

      // -------------------------------------------------------
      // 2. GET REAL ROLE FROM DATABASE
      // -------------------------------------------------------

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('role, school_id')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();

        setError(
          'Your account profile could not be found. Contact your school administrator.'
        );

        return;
      }

      // -------------------------------------------------------
      // 3. ROLE VALIDATION
      // -------------------------------------------------------

      const databaseRole = profile.role;

      const expectedDatabaseRole =
        role === 'principal'
          ? 'admin'
          : role;

      if (databaseRole !== expectedDatabaseRole) {
        await supabase.auth.signOut();

        const actualPortal =
          databaseRole === 'admin'
            ? 'Principal'
            : databaseRole === 'teacher'
              ? 'Teacher'
              : databaseRole === 'student'
                ? 'Student'
                : 'another';

        setError(
          `This account belongs to the ${actualPortal} portal. Please choose the correct login type.`
        );

        return;
      }

      // -------------------------------------------------------
      // 4. REDIRECT
      // -------------------------------------------------------

      if (databaseRole === 'admin') {
        router.replace('/principal');
      } else if (databaseRole === 'teacher') {
        router.replace('/teacher');
      } else if (databaseRole === 'student') {
        router.replace('/student');
      } else {
        await supabase.auth.signOut();

        setError('This account does not have a valid portal role.');
      }
    } catch (err) {
      console.error('Login error:', err);

      setError(
        'Something went wrong while signing in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // UI
  // =========================================================

 return (
  <div>
    {/* Role */}
    <div className="mb-8">
      <div
        className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${config.iconContainer}`}
      >
        <RoleIcon
          className={`h-5 w-5 ${config.iconColor}`}
          strokeWidth={1.8}
        />
      </div>

      <h1 className="text-[28px] font-bold tracking-[-0.025em] text-slate-950">
        Welcome back
      </h1>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        Sign in to your{' '}
        <span className="font-medium text-slate-700">
          {role === 'principal'
            ? 'Principal'
            : role === 'teacher'
              ? 'Teacher'
              : 'Student'}
        </span>{' '}
        account to continue.
      </p>
    </div>

    {/* Error */}
    {error && (
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

        <p className="text-xs leading-5 text-red-700">
          {error}
        </p>
      </div>
    )}

    <form onSubmit={handleLogin} className="space-y-5">

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-xs font-semibold text-slate-700"
        >
          Email address
        </label>

        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />

          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="you@school.edu.np"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition
            placeholder:text-slate-400
            hover:border-slate-300
            focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
            disabled:bg-slate-100"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-xs font-semibold text-slate-700"
          >
            Password
          </label>

          <Link
            href="/auth/forgot-password"
            className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Forgot password?
          </Link>
        </div>

        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />

          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            disabled={loading}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Enter your password"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition
            placeholder:text-slate-400
            hover:border-slate-300
            focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
            disabled:bg-slate-100"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-[17px] w-[17px]" />
            ) : (
              <Eye className="h-[17px] w-[17px]" />
            )}
          </button>
        </div>
      </div>

      {/* Button */}
      <button
        type="submit"
        disabled={loading}
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition
        hover:bg-blue-700
        focus:outline-none focus:ring-4 focus:ring-blue-500/20
        disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>

    {/* Principal registration */}
    {role === 'principal' && (
      <div className="mt-7 border-t border-slate-200 pt-6 text-center">
        <p className="text-sm text-slate-500">
          Don't have a school account?{' '}
          <Link
            href="/auth/signup"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Register your school
          </Link>
        </p>
      </div>
    )}

    {/* School portal */}
    {schoolSlug && (
      <div className="mt-5 text-center">
        <Link
          href={`/s/${schoolSlug}/login`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Choose another portal
        </Link>
      </div>
    )}

    <div className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
      <ShieldCheck className="h-3.5 w-3.5" />
      Protected by secure authentication
    </div>
  </div>
);
}
