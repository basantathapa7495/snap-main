import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, LockKeyhole, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function PasswordAuthShell({ eyebrow, title, description, children }: Props) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f8ff] text-slate-950">
      <div className="pointer-events-none absolute -left-40 -top-48 h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-52 -right-44 h-[520px] w-[520px] rounded-full bg-indigo-200/40 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <aside className="relative hidden overflow-hidden bg-[#071a3a] px-12 py-10 text-white lg:flex lg:flex-col xl:px-20">
          <div className="pointer-events-none absolute -right-40 -top-44 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-60 -left-36 h-[560px] w-[560px] rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
          <Link href="/" className="relative flex w-fit items-center gap-3" aria-label="NEPSOM home">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg">
              <Image src="/logo1.png" alt="" width={34} height={34} className="object-contain" priority />
            </span>
            <span className="text-xl font-extrabold tracking-tight">NEPSOM</span>
          </Link>

          <div className="relative my-auto max-w-lg py-16">
            <div className="mb-9 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-2xl shadow-blue-950/30">
              <LockKeyhole className="h-7 w-7 text-blue-200" strokeWidth={1.6} />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">Your school, connected</p>
            <h2 className="mt-4 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Get back to the work that matters.
            </h2>
            <p className="mt-6 max-w-md text-base leading-8 text-slate-300">
              Reset your password securely, then return to your school workspace with everything in its place.
            </p>
            <div className="mt-10 space-y-4 text-sm text-slate-200">
              <p className="flex items-center gap-3"><Check className="h-5 w-5 shrink-0 text-cyan-300" /> One email link to verify your request</p>
              <p className="flex items-center gap-3"><Check className="h-5 w-5 shrink-0 text-cyan-300" /> A new password only you know</p>
            </div>
          </div>
          <p className="relative flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4" /> Built for schools in Nepal
          </p>
        </aside>

        <section className="flex min-w-0 flex-col px-5 py-6 sm:px-10 sm:py-10 lg:px-14 xl:px-20">
          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="NEPSOM home">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                <Image src="/logo1.png" alt="" width={30} height={30} className="object-contain" priority />
              </span>
              <span className="text-lg font-extrabold tracking-tight">NEPSOM</span>
            </Link>
            <Link href="/auth/login" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-12 sm:py-16">
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                <ShieldCheck className="h-3.5 w-3.5" /> {eyebrow}
              </span>
              <h1 className="mt-5 text-[32px] font-bold leading-[1.15] tracking-[-0.035em] text-slate-950 sm:text-[38px]">{title}</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
            </div>
            <div className="rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_60px_-22px_rgba(15,23,42,0.2)] sm:p-8">
              {children}
            </div>
            <p className="mt-7 text-center text-xs leading-5 text-slate-500">
              Need help? Contact your school administrator.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
