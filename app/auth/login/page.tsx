'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  School,
  Users,
  Smartphone,
} from 'lucide-react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">

        {/* ================= LEFT ================= */}
        <section className="relative hidden overflow-hidden bg-[#07152f] lg:flex lg:flex-col">

          {/* Background */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[120px]" />
            <div className="absolute -bottom-40 right-[-100px] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />

            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #93c5fd 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }}
            />
          </div>

          <div className="relative z-10 flex h-full flex-col px-12 py-10 xl:px-16">

            {/* Brand */}
            <Link href="/" className="flex w-fit items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg shadow-black/10">
                <img
                  src="/logo1.png"
                  alt="SNAP"
                  className="h-8 w-8 object-contain"
                />
              </div>

              <div>
                <div className="text-lg font-bold tracking-tight text-white">
                  SNAP
                </div>
                <div className="text-[11px] text-slate-400">
                  School Nepal Administration Platform
                </div>
              </div>
            </Link>

            {/* Main */}
            <div className="my-auto max-w-xl">

              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure school management
              </div>

              <h1 className="mt-7 max-w-lg text-[44px] font-bold leading-[1.08] tracking-[-0.035em] text-white xl:text-[52px]">
                One place to run
                <span className="block text-blue-400">
                  your entire school.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-[15px] leading-7 text-slate-400">
                Students, teachers, attendance, fees, results and
                communication — connected through one simple platform
                built for schools in Nepal.
              </p>

              {/* Benefits */}
              <div className="mt-9 grid grid-cols-3 gap-3">

                <Benefit
                  icon={School}
                  title="Built for Nepal"
                  text="Made for local schools"
                />

                <Benefit
                  icon={Users}
                  title="One platform"
                  text="Everyone connected"
                />

                <Benefit
                  icon={Smartphone}
                  title="Use anywhere"
                  text="Phone or computer"
                />

              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>
                © {new Date().getFullYear()} SNAP
              </span>

              <span>
                Built for schools in Nepal
              </span>
            </div>
          </div>
        </section>

        {/* ================= RIGHT ================= */}
        <section className="relative flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 sm:px-8">

          <Link
            href="/"
            className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 lg:left-8 lg:top-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to SNAP
          </Link>

          <div className="w-full max-w-[430px]">

            {/* Mobile branding */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                <img
                  src="/logo1.png"
                  alt="SNAP"
                  className="h-8 w-8 object-contain"
                />
              </div>

              <div>
                <p className="font-bold text-slate-900">SNAP</p>
                <p className="text-[11px] text-slate-500">
                  School Nepal Administration Platform
                </p>
              </div>
            </div>

            <Suspense fallback={<LoginSkeleton />}>
              <LoginForm />
            </Suspense>

          </div>
        </section>
      </div>
    </main>
  );
}

function Benefit({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
        <Icon
          className="h-4 w-4 text-blue-400"
          strokeWidth={1.8}
        />
      </div>

      <p className="mt-3 text-xs font-semibold text-white">
        {title}
      </p>

      <p className="mt-1 text-[11px] leading-4 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-8 w-52 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-4 w-72 animate-pulse rounded bg-slate-200" />

      <div className="pt-5">
        <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-4 h-12 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-5 h-12 animate-pulse rounded-xl bg-slate-300" />
      </div>
    </div>
  );
}