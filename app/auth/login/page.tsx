import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from 'lucide-react';
import LoginForm from '@/components/LoginForm';

const highlights = [
  { icon: ClipboardCheck, label: 'Attendance' },
  { icon: WalletCards, label: 'Fees' },
  { icon: BarChart3, label: 'Results' },
];

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden="true">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(480px,0.92fr)]">
        <section className="relative hidden overflow-hidden bg-[#071a3a] lg:flex lg:min-h-screen lg:flex-col">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -left-40 -top-44 h-[560px] w-[560px] rounded-full bg-blue-500/20 blur-[110px]" />
            <div className="absolute -bottom-52 -right-28 h-[620px] w-[620px] rounded-full bg-indigo-500/15 blur-[130px]" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: 'radial-gradient(circle, #bfdbfe 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#041127] to-transparent" />
          </div>

          <div className="relative z-10 flex min-h-screen flex-col px-10 py-9 xl:px-16 xl:py-11">
            <Brand light />

            <div className="my-auto max-w-2xl py-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/10 px-3.5 py-1.5 text-xs font-semibold text-blue-200">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.9} />
                Secure access for your school
              </div>

              <h1 className="mt-7 max-w-xl text-5xl font-bold leading-[1.06] tracking-[-0.045em] text-white xl:text-[58px]">
                Your school day,
                <span className="block bg-gradient-to-r from-blue-300 to-cyan-200 bg-clip-text text-transparent">
                  all in one place.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300/80">
                Sign in to manage students, teachers, attendance, fees, results,
                notices and everyday school work from any device.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                {highlights.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium text-slate-200 backdrop-blur-sm"
                  >
                    <Icon className="h-4 w-4 text-blue-300" strokeWidth={1.9} />
                    {label}
                  </div>
                ))}
              </div>

              <div className="mt-12 max-w-lg rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-400/15 text-blue-200">
                    <GraduationCap className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Built for schools in Nepal</p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-400">
                      Simple enough for daily use, powerful enough to keep the whole school connected.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>© {new Date().getFullYear()} SNAP</span>
              <span className="inline-flex items-center gap-2">
                <Smartphone className="h-3.5 w-3.5" />
                Works on phone and computer
              </span>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen flex-col px-4 py-5 sm:px-8 sm:py-8 lg:justify-center lg:px-10 xl:px-16">
          <div className="mx-auto flex w-full max-w-[500px] items-center justify-between lg:absolute lg:left-10 lg:right-10 lg:top-8 lg:mx-0 lg:max-w-none xl:left-16 xl:right-16">
            <div className="lg:hidden">
              <Brand />
            </div>
            <Link
              href="/"
              className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Home
            </Link>
          </div>

          <div className="mx-auto mt-10 w-full max-w-[500px] flex-1 sm:mt-14 lg:mt-0 lg:flex-none">
            <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.3)] sm:p-8">
              <Suspense fallback={<LoginSkeleton />}>
                <LoginForm />
              </Suspense>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={2} />
              Your sign-in information is securely protected
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex w-fit items-center gap-3" aria-label="SNAP home">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg shadow-black/10 ring-1 ring-slate-200/60">
        <Image src="/logo1.png" alt="" width={34} height={34} className="object-contain" priority />
      </div>
      <div>
        <p className={`text-lg font-extrabold leading-none tracking-tight ${light ? 'text-white' : 'text-slate-950'}`}>
          SNAP
        </p>
        <p className={`mt-1 text-[10px] font-medium ${light ? 'text-slate-400' : 'text-slate-500'}`}>
          School Nepal Administration Platform
        </p>
      </div>
    </Link>
  );
}

function LoginSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-36 rounded-lg bg-slate-200" />
      <div className="mt-3 h-4 w-72 rounded bg-slate-100" />
      <div className="mt-8 h-12 rounded-xl bg-slate-100" />
      <div className="mt-6 h-12 rounded-xl bg-slate-100" />
      <div className="mt-4 h-12 rounded-xl bg-slate-100" />
      <div className="mt-6 h-12 rounded-xl bg-slate-200" />
    </div>
  );
}
