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

async function finishPendingSchoolRegistration() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken) {
    throw new Error('Your session is not ready. Please sign in again.');
  }

  const response = await fetch('/api/complete-school-registration', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Your school workspace could not be created.');
  }
  return result as { role: string; school_id: string };
}

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
        .maybeSingle();

      let resolvedProfile = profile;

      // Teacher/student accounts created by a school administrator also carry
      // server-controlled app metadata. Use it if a profile request is
      // temporarily unavailable, then let the portal load the persisted row.
      if (profileError || !resolvedProfile) {
        const metadataRole = authData.user.app_metadata?.role;
        const metadataSchoolId = authData.user.app_metadata?.school_id;

        if (
          (metadataRole === 'teacher' || metadataRole === 'student') &&
          typeof metadataSchoolId === 'string' &&
          metadataSchoolId
        ) {
          resolvedProfile = {
            role: metadataRole,
            school_id: metadataSchoolId,
          };
        }
      }

      if (!resolvedProfile) {
        try {
          resolvedProfile = await finishPendingSchoolRegistration();
        } catch (setupError) {
          setError(setupError instanceof Error ? setupError.message : 'Your school workspace could not be created.');
          return;
        }
      }

      if (!resolvedProfile) {
        await supabase.auth.signOut();
        setError(
          'Your login exists, but it is not connected to a school profile. Ask the principal to recreate or repair this account.'
        );
        return;
      }

      await supabase.auth.refreshSession();

      // -------------------------------------------------------
      // 3. ROLE VALIDATION
      // -------------------------------------------------------

      const databaseRole = resolvedProfile.role;

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
        const mustChangePassword =
          authData.user.app_metadata?.must_change_password === true;

        router.replace(
          mustChangePassword ? '/auth/change-password' : '/teacher'
        );
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

  const roleOptions: Array<{ value: PortalRole; label: string; icon: React.ElementType }> = [
    { value: 'principal', label: 'Principal', icon: ShieldCheck },
    { value: 'teacher', label: 'Teacher', icon: GraduationCap },
    { value: 'student', label: 'Student', icon: UserRound },
  ];

  const selectedRoleLabel = roleOptions.find((option) => option.value === role)?.label;

  return (
    <div>
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${config.iconContainer}`}>
          <RoleIcon className={`h-5 w-5 ${config.iconColor}`} strokeWidth={1.9} />
        </div>
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] text-slate-950">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">{config.description}</p>
        </div>
      </div>

      <div className="mt-7">
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Choose your portal
        </p>
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5">
          {roleOptions.map(({ value, label, icon: Icon }) => {
            const isActive = role === value;
            const href = `/auth/login?role=${value}${schoolSlug ? `&school=${encodeURIComponent(schoolSlug)}` : ''}`;

            return (
              <Link
                key={value}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition sm:flex-row ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs leading-5 text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="mt-6 space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-xs font-semibold text-slate-700">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              disabled={loading}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError('');
              }}
              placeholder="you@school.edu.np"
              className={`h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 ${config.focusRing}`}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-semibold text-slate-700">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-xs font-semibold text-blue-600 transition hover:text-blue-800">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              disabled={loading}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              placeholder="Enter your password"
              className={`h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 ${config.focusRing}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`group flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${config.button}`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in securely…
            </>
          ) : (
            <>
              Sign in as {selectedRoleLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {role === 'principal' && (
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3.5 text-center">
          <p className="text-sm text-slate-600">
            Don&apos;t have a school account?{' '}
            <Link href="/auth/signup" className="font-semibold text-blue-700 hover:text-blue-900">
              Register your school free
            </Link>
          </p>
        </div>
      )}

      {schoolSlug && (
        <div className="mt-5 text-center">
          <Link href={`/s/${schoolSlug}/login`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to your school portal
          </Link>
        </div>
      )}
    </div>
  );
}
