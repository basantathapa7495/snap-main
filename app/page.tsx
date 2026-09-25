'use client';
import WhatsAppButton from '@/components/WhatsAppButton';
import LandingNavbar from '@/components/LandingNavbar';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck,
  MapPin,
  Smartphone,
  BadgeDollarSign,
  School,
  Link2,
  ArrowRight,
  CheckCircle2,
  Users,
  ClipboardCheck,
  WalletCards,
  FilePenLine,
  FileText,
  Megaphone,
  Inbox,
  Cake,
  GraduationCap,
  UserRound,
  LayoutDashboard,
  Palette,
  Sparkles,
  Quote,
  BadgeCheck,
  Check, 
  CalendarDays,
  PlayCircle,
  CircleHelp,
  Mail,
  Phone,
} from "lucide-react";

export default function HomePage() {
  const [schools, setSchools] = useState<any[]>([]);
  // Fetch REAL schools from the database — makes the page feel alive
  useEffect(() => {
    async function loadSchools() {
      const { data } = await supabase
        .from('schools')
        .select('name, district')
        .order('created_at', { ascending: false })
        .limit(4);
      setSchools(data || []);
    }
    loadSchools();
  }, []);

  const compareRows = [
    { task: 'Find unpaid fees', old: 'Search registers for unpaid students', nepsom: 'View fee dues and contact details' },
    { task: 'Collect fees', old: 'Write receipts and totals by hand', nepsom: 'Record payments and print receipts' },
    { task: 'Mark attendance', old: 'Use a paper register each day', nepsom: 'Mark and review attendance by class' },
    { task: 'Share notices', old: 'Send paper notices home', nepsom: 'Publish notices online' },
    { task: 'Calculate exam results', old: 'Add marks and grades manually', nepsom: 'Enter marks and calculate results' },
    { task: 'Prepare report cards', old: 'Make each card one at a time', nepsom: 'Create printable report cards' },
    { task: 'Manage admissions', old: 'Sort through paper forms', nepsom: 'Review applications in one inbox' },
    { task: 'Find student records', old: 'Search files for student details', nepsom: 'Find student profiles quickly' },
  ];
  function NepalIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 2v20M7 3l9 7H9l8 9H7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

  return (
    <main className="nepsom-home overflow-x-clip bg-white text-gray-800 antialiased">
      {/* ===== Trust Badges Bar ===== */}
<div className="border-b border-blue-600 bg-blue-700 px-4 py-2.5 text-center text-xs font-medium text-white sm:text-sm">

  {/* ===== Mobile Trust Bar ===== */}
  <div className="flex items-center justify-center gap-2 sm:hidden">
    <ShieldCheck
      className="h-4 w-4 shrink-0 text-blue-200"
      strokeWidth={2}
    />

    <span className="whitespace-nowrap">
      Secure school data
    </span>

    <span className="text-blue-300">•</span>

    <span className="whitespace-nowrap">
      Made for Nepal
    </span>
  </div>

  {/* ===== Desktop Trust Bar ===== */}
  <div className="hidden flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:flex">

    <span className="flex items-center gap-1.5">
      <ShieldCheck
        className="h-5 w-5 text-blue-200"
        strokeWidth={2}
      />
      Data Secure
    </span>

    <span className="text-blue-400">|</span>

    <span className="flex items-center gap-1.5">
      <NepalIcon className="h-5 w-5 text-blue-200" />
      Made in Nepal
    </span>

    <span className="text-blue-400">|</span>

    <span className="flex items-center gap-1.5">
      <Smartphone
        className="h-5 w-5 text-blue-200"
        strokeWidth={2}
      />
      Works on Any Phone
    </span>

    <span className="text-blue-400">|</span>

    <span className="flex items-center gap-1.5">
      <BadgeDollarSign
        className="h-5 w-5 text-blue-200"
        strokeWidth={2}
      />
      No Hidden Fees
    </span>

  </div>
</div>

      {/* ===== Navbar ===== */}
      <LandingNavbar />

      {/* ===== Hero ===== */}
      <section className="nepsom-pattern-grid relative overflow-hidden">
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-4 px-4 py-6 sm:gap-12 sm:px-6 sm:py-16 md:grid-cols-2 md:py-24 lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
              Ready to take your school digital?
            </p>
            <h1 className="mt-3 max-w-[15ch] text-[clamp(2.15rem,9vw,3rem)] font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:mt-5 sm:max-w-none sm:text-4xl md:text-5xl">
              Run your whole school from one phone
            </h1>
            <p className="mt-3 max-w-prose text-[15px] leading-7 text-gray-600 sm:mt-5 sm:text-lg">
              Attendance, fees, exams, reports, notices, students and teachers — manage from one place, without registers and endless photocopies.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <Link href="/auth/signup" className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 sm:w-auto">
                Register your school
              </Link>
              <a
                href="/s/sunrise-valley-secondary"
                target="_blank"
                className="hidden min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-6 py-3 text-center font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 sm:flex sm:w-auto"
              >
                <PlayCircle className="h-5 w-5" aria-hidden="true" /> See live demo
              </a>
            </div>
            <p className="mt-4 hidden text-center text-xs leading-5 text-gray-500 sm:block sm:text-left sm:text-sm">
              No credit card required · Setup in 10 minutes
            </p>
          </div>

          {/* Hero photo with floating cards */}
          <div className="relative min-w-0">
            <Image
              src="/hero-image.png"
              alt="School administrator checking school information on a phone"
              width={1536}
              height={1024}
              sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1279px) 50vw, 600px"
              priority
              className="h-auto w-full rounded-2xl border border-blue-100 object-contain shadow-lg shadow-blue-950/10 sm:rounded-3xl"
            />
          </div>
        </div>
      </section>

      {/* ===== Live schools ticker ===== */}
      {schools.length > 0 && (
  <section className="mx-auto hidden max-w-7xl px-4 pt-8 sm:block sm:px-6 lg:px-8">
    <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
      Schools already on NEPSOM
    </p>

    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {schools.slice(0, 6).map((s, i) => (
        <span
          key={i}
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-sm sm:px-4 sm:text-sm"
        >
          {/* School icon */}
          <svg
            className="h-4 w-4 shrink-0 text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 21h18" />
            <path d="M5 21V9l7-4 7 4v12" />
            <path d="M9 21v-5h6v5" />
            <path d="M9 11h.01" />
            <path d="M12 11h.01" />
            <path d="M15 11h.01" />
          </svg>

          <span>
            {s.name}
            {s.district ? ` · ${s.district}` : ''}
          </span>
        </span>
      ))}
    </div>
  </section>
)}

      {/* ===== From manual to simple ===== */}
      <section className="bg-slate-50 py-10 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-blue-700 shadow-sm sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
              A simpler school day
            </span>
            <h2 className="mt-4 text-[clamp(1.75rem,6vw,2.5rem)] font-extrabold leading-tight tracking-tight text-gray-950 sm:mt-5 sm:text-4xl">
              Less paperwork.
              <span className="block text-blue-600">More time for students.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base">
              Track fees, share notices and prepare report cards in one place.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:mt-9 sm:gap-5 md:grid-cols-3">
            {[
              {
                title: 'Fee dues',
                image: '/fees.png',
                alt: 'School fee management',
                before: 'Check registers by hand.',
                after: 'See unpaid fees in one place.',
              },
              {
                title: 'School notices',
                image: '/notice.png',
                alt: 'School notices',
                before: 'Send paper notices.',
                after: 'Publish notices online.',
              },
              {
                title: 'Report cards',
                image: '/report.png',
                alt: 'School report cards',
                before: 'Calculate marks one by one.',
                after: 'Create printable results faster.',
              },
            ].map((item) => (
              <article
                key={item.title}
                className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:flex-col"
              >
                <div className="relative w-24 shrink-0 self-stretch bg-slate-100 sm:h-40 sm:w-full lg:h-44">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 639px) 96px, (max-width: 1023px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 p-3.5 sm:p-5">
                  <h3 className="text-base font-bold text-gray-950 sm:text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-gray-500">
                    <span className="font-semibold text-gray-700">Before:</span> {item.before}
                  </p>
                  <p className="mt-1.5 text-sm leading-5 text-blue-700">
                    <span className="font-semibold">With NEPSOM:</span> {item.after}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Video Demo ===== */}
<section
  id="video"
  className="relative hidden scroll-mt-24 overflow-hidden bg-gray-950 py-12 sm:block sm:py-20 lg:py-28"
>
  {/* Background decoration */}
  <div
    className="pointer-events-none absolute inset-0 hidden sm:block"
    aria-hidden="true"
  >
    <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
    <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-[100px]" />
  </div>

  <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Heading */}
    <div className="mx-auto max-w-3xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-300 backdrop-blur">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
        </span>
        Product Demo
      </div>

      <h2 className="mt-5 text-[clamp(1.75rem,7.2vw,2.25rem)] leading-tight font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
        See how NEPSOM works
        <span className="block text-blue-400">
          before you register
        </span>
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
        Watch a quick walkthrough of how principals, teachers, and students use
        NEPSOM for attendance, fees, exams, notices, and everyday school work.
      </p>
    </div>

    {/* Video area */}
    <div className="mx-auto mt-12 max-w-5xl">
      <div className="relative">
        {/* Glow */}
        <div
          className="absolute -inset-4 -z-10 rounded-[2rem] bg-blue-500/10 blur-2xl"
          aria-hidden="true"
        />

        {/* Browser frame */}
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-gray-900 shadow-2xl shadow-black/40">
          {/* Browser header */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-gray-900/90 px-3 py-3 sm:gap-4 sm:px-5">
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>

            <div className="flex min-w-0 flex-1 justify-center">
              <div className="flex min-w-0 max-w-sm flex-1 items-center justify-center gap-2 truncate rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-gray-500">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                >
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10V7a4 4 0 018 0v3"
                  />
                </svg>

                <span className="truncate">nepsom.xyz/demo</span>
              </div>
            </div>

            <div className="hidden w-[42px] shrink-0 sm:block" />
          </div>

          {/* Video */}
          <div className="relative bg-black">
            <iframe
              className="aspect-video w-full"
              src="https://www.youtube.com/embed/nigWHG_TH2U?rel=0&modestbranding=1"
              title="NEPSOM school management system demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Bottom trust points */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-400">
        <span className="inline-flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 text-blue-400"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12l4 4L19 6"
            />
          </svg>
          Principal dashboard
        </span>

        <span className="inline-flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 text-blue-400"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12l4 4L19 6"
            />
          </svg>
          Attendance & fees
        </span>

        <span className="inline-flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 text-blue-400"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12l4 4L19 6"
            />
          </svg>
          Exams & notices
        </span>

        <span className="inline-flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 text-blue-400"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12l4 4L19 6"
            />
          </svg>
          Student & teacher portals
        </span>
      </div>
    </div>
  </div>
</section>

      {/* ===== Simple setup ===== */}
      <section id="how" className="scroll-mt-24 bg-white py-10 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
              Simple setup
            </span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-950 sm:mt-4 sm:text-4xl">
              Get started in 3 easy steps
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 sm:mt-3 sm:text-base">
              No installation or technical team needed.
            </p>
          </div>

          <ol className="mx-auto mt-6 grid max-w-4xl gap-3 sm:mt-9 sm:grid-cols-3 sm:gap-4">
            {[
              {
                title: 'Register your school',
                detail: 'Enter your school details.',
                Icon: School,
              },
              {
                title: 'Add your people',
                detail: 'Add classes, teachers and students.',
                Icon: Users,
              },
              {
                title: 'Start managing',
                detail: 'Track attendance, fees and more.',
                Icon: CheckCircle2,
              },
            ].map(({ title, detail, Icon }, index) => (
              <li
                key={title}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-col sm:items-start sm:p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white sm:h-12 sm:w-12" aria-hidden="true">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
                    Step {index + 1}
                  </span>
                  <h3 className="mt-0.5 text-base font-bold text-gray-950 sm:text-lg">{title}</h3>
                  <p className="mt-0.5 text-sm leading-5 text-gray-600">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

     {/* ===== ⚖️ COMPARISON TABLE ===== */}
<section className="nepsom-pattern-grid relative overflow-hidden py-12 sm:py-20 lg:py-24">
  <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <div className="text-center">
      <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600 mb-4 ring-1 ring-inset ring-red-100">
        ⚖️ Honest Comparison
      </span>
      <h2 className="text-[clamp(1.75rem,7.2vw,2.25rem)] font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
        NEPSOM vs <span className="text-red-500">Manual Registers</span>
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
        See how eight everyday school tasks work with paper records and with NEPSOM.
      </p>
    </div>

    {/* Desktop Table */}
    <div className="mt-12 hidden sm:block">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-gray-900 to-gray-800">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider w-1/3">Task</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-red-300 uppercase tracking-wider w-1/3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-xs">✕</span>
                  Old Way
                </span>
              </th>
              <th className="relative px-6 py-4 text-left text-sm font-semibold text-emerald-300 uppercase tracking-wider w-1/3">
                {/* Highlighted column background */}
                <div className="absolute inset-0 bg-emerald-500/10"></div>
                <span className="relative inline-flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs">✓</span>
                  NEPSOM
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {compareRows.map((r, i) => (
              <tr key={i} className="group transition-colors hover:bg-gray-50/80">
                <td className="px-6 py-4 font-semibold text-gray-900">
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-bold text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      {i + 1}
                    </span>
                    {r.task}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 line-through decoration-red-300/50">{r.old}</td>
                <td className="relative px-6 py-4 font-semibold text-emerald-700">
                  <div className="absolute inset-0 bg-emerald-50/50 group-hover:bg-emerald-50 transition-colors"></div>
                  <span className="relative flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {r.nepsom}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Compact comparison table for phones */}
    <div className="mt-6 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm sm:hidden">
      <table className="w-full table-fixed border-collapse text-left text-xs leading-4">
        <caption className="sr-only">Eight school tasks compared with manual registers and NEPSOM</caption>
        <colgroup>
          <col className="w-[31%]" />
          <col className="w-[32%]" />
          <col className="w-[37%]" />
        </colgroup>
        <thead className="text-white">
          <tr>
            <th scope="col" className="border-b border-r border-slate-500 bg-slate-800 px-2.5 py-3 font-semibold">
              <span className="inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
                Task
              </span>
            </th>
            <th scope="col" className="border-b border-r border-white/25 bg-rose-600 px-2 py-3 font-semibold">
              <span className="inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16 4l4 4-11 11-5 1 1-5L16 4z" />
                </svg>
                Manual
              </span>
            </th>
            <th scope="col" className="border-b border-white/25 bg-emerald-600 px-2 py-3 font-semibold">
              <span className="inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="13" rx="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
                </svg>
                NEPSOM
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            { task: 'Fee dues', manual: 'Search registers', nepsom: 'View dues list' },
            { task: 'Fee payments', manual: 'Write receipts', nepsom: 'Print receipts' },
            { task: 'Attendance', manual: 'Paper register', nepsom: 'Mark by class' },
            { task: 'Notices', manual: 'Send paper', nepsom: 'Publish online' },
            { task: 'Exam results', manual: 'Add marks by hand', nepsom: 'Calculate results' },
            { task: 'Report cards', manual: 'Make each card', nepsom: 'Print report cards' },
            { task: 'Admissions', manual: 'Sort forms', nepsom: 'Review in one inbox' },
            { task: 'Student records', manual: 'Search files', nepsom: 'Find profiles' },
          ].map((row) => (
            <tr key={row.task}>
              <th scope="row" className="border-b border-r border-slate-200 bg-white px-2.5 py-3 font-semibold text-slate-900">
                {row.task}
              </th>
              <td className="border-b border-r border-slate-200 bg-rose-50/70 px-2 py-3 text-rose-900">{row.manual}</td>
              <td className="border-b border-slate-200 bg-emerald-50/70 px-2 py-3 font-semibold text-emerald-900">{row.nepsom}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Bottom Summary */}
    <div className="mt-8 hidden flex-col items-center gap-4 sm:flex sm:flex-row sm:justify-center">
      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-3">
        <span className="text-2xl">😩</span>
        <div>
          <p className="text-sm font-bold text-red-800">Old Way</p>
          <p className="text-xs text-red-600">Hours of paperwork, errors, lost data</p>
        </div>
      </div>

      <svg className="h-6 w-6 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
      <span className="text-2xl sm:hidden">⬇️</span>

      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-3 ring-2 ring-green-200/50">
        <span className="text-2xl">🚀</span>
        <div>
          <p className="text-sm font-bold text-green-800">With NEPSOM</p>
          <p className="text-xs text-green-600">Minutes, not hours. Less paperwork. Fewer mistakes. Better organized.</p>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* ===== Features ===== */}
<section
  id="features"
  className="nepsom-pattern-grid relative scroll-mt-24 overflow-hidden bg-white py-12 sm:py-20 lg:py-28"
>
  <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Heading */}
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
        <Sparkles className="h-4 w-4" strokeWidth={1.8} />
        Complete solution
      </span>

      <h2 className="mt-5 text-[clamp(1.75rem,7.2vw,2.25rem)] leading-tight font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
        Everything your school needs,
        <span className="text-blue-600"> in one place</span>
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
        Manage students, attendance, fees, exams, notices, and more without
        switching between registers, spreadsheets, and separate systems.
      </p>
    </div>

    {/* Features grid */}
    <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[
        {
          icon: Users,
          title: 'Students',
          desc: 'Manage student profiles, class, section, roll number, parent details, and more.',
        },
        {
          icon: ClipboardCheck,
          title: 'Attendance',
          desc: 'Mark attendance quickly and view records by date, class, and section.',
        },
        {
          icon: WalletCards,
          title: 'Fees & Receipts',
          desc: 'Record payments, track collections, view dues, and generate receipts.',
        },
        {
          icon: FilePenLine,
          title: 'Exams & Marks',
          desc: 'Enter subject marks and automatically calculate percentage, grade, and GPA.',
        },
        {
          icon: FileText,
          title: 'Report Cards',
          desc: 'Create clean, printable student report cards and save them as PDF.',
        },
        {
          icon: Megaphone,
          title: 'Notice Board',
          desc: 'Publish school notices for students, teachers, parents, or everyone.',
        },
        {
          icon: Inbox,
          title: 'Online Admissions',
          desc: 'Accept applications online and manage approvals from one admissions inbox.',
        },
        {
          icon: Cake,
          title: 'Birthday Alerts',
          desc: 'See today’s and upcoming student birthdays directly from the dashboard.',
        },
        {
          icon: GraduationCap,
          title: 'Teacher Portal',
          desc: 'Teachers can manage classes, attendance, students, marks, and daily school work.',
        },
        {
          icon: UserRound,
          title: 'Student Portal',
          desc: 'Students can view attendance, fees, exams, receipts, notices, and profile details.',
        },
        {
          icon: LayoutDashboard,
          title: 'Smart Dashboard',
          desc: 'See attendance, fee progress, alerts, admissions, and school activity at a glance.',
        },
        {
          icon: Palette,
          title: 'Custom Branding',
          desc: 'Add your school logo, theme color, gallery, programs, and public school website.',
        },
      ].map((feature, i) => {
        const Icon = feature.icon;

        return (
          <article
            key={feature.title}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
          >
            {/* Hover accent */}
            <div
              className="absolute inset-x-0 top-0 h-1 scale-x-0 bg-blue-600 transition-transform duration-300 group-hover:scale-x-100"
              aria-hidden="true"
            />

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-950">
                    {feature.title}
                  </h3>

                  <span className="text-[10px] font-medium text-gray-300">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                <p className="mt-1.5 text-sm leading-6 text-gray-600">
                  {feature.desc}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>

    {/* Bottom message */}
    <div className="mt-12 flex justify-center">
      <div className="flex max-w-full items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-600">
        <LayoutDashboard
          className="h-5 w-5 shrink-0 text-blue-600"
          strokeWidth={1.8}
        />

        <span className="min-w-0">
          One login. One dashboard. One connected school system.
        </span>
      </div>
    </div>
  </div>
</section>

      

      {/* ===== Testimonials ===== */}
<section className="nepsom-pattern-grid relative overflow-hidden bg-white py-12 sm:py-20 lg:py-28">
  <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Heading */}
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
        <Quote className="h-4 w-4" strokeWidth={1.8} />
        School stories
      </span>

      <h2 className="mt-5 text-[clamp(1.75rem,7.2vw,2.25rem)] leading-tight font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
        What school leaders say
        <span className="text-blue-600"> about NEPSOM</span>
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
        Simple tools matter most when they make everyday school work less tiring.
      </p>
    </div>

    {/* Cards */}
    <div className="mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pr-4 [scrollbar-width:none] sm:mt-14 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0 lg:pr-0">
      {/* Testimonial 1 */}
      <article className="group relative flex h-full min-w-[min(82vw,360px)] lg:min-w-0 snap-start flex-col overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl sm:h-12 sm:w-12 bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <Quote className="h-5 w-5" strokeWidth={2} />
          </div>

          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
            Fees
          </span>
        </div>

        <p className="mt-5 text-[15px] leading-7 text-gray-700 sm:mt-7">
          “Before NEPSOM, we had to check several registers just to know who still
          had fees due. Now I can see the list in one place and call parents
          directly. It saves a lot of unnecessary back-and-forth.”
        </p>

        <div className="mt-auto pt-6 sm:pt-8">
          <div className="border-t border-blue-100 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                SG
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-gray-950">
                    Sunita Gurung
                  </p>

                  <BadgeCheck
                    className="h-4 w-4 shrink-0 text-blue-600"
                    strokeWidth={2}
                  />
                </div>

                <p className="mt-0.5 text-xs text-gray-500">
                  Principal
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <School className="h-3.5 w-3.5" strokeWidth={1.8} />
                Shree Himalaya Secondary
              </span>

              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />
                Kaski
              </span>
            </div>
          </div>
        </div>
      </article>

      {/* Testimonial 2 */}
      <article className="group relative flex h-full min-w-[min(82vw,360px)] lg:min-w-0 snap-start flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <Quote className="h-5 w-5" strokeWidth={2} />
          </div>

          <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
            Attendance
          </span>
        </div>

        <p className="mt-7 text-[15px] leading-7 text-gray-700">
          “I thought some of our teachers would struggle with a new system, but
          they understood it much faster than I expected. Attendance is probably
          the part they use the most now.”
        </p>

        <div className="mt-auto pt-8">
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                RT
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-gray-950">
                    Ram Bahadur Thapa
                  </p>

                  <BadgeCheck
                    className="h-4 w-4 shrink-0 text-blue-600"
                    strokeWidth={2}
                  />
                </div>

                <p className="mt-0.5 text-xs text-gray-500">
                  Vice Principal
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <School className="h-3.5 w-3.5" strokeWidth={1.8} />
                Janata Basic School
              </span>

              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />
                Udayapur
              </span>
            </div>
          </div>
        </div>
      </article>

      {/* Testimonial 3 */}
      <article className="group relative flex h-full min-w-[min(82vw,360px)] lg:min-w-0 snap-start flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <Quote className="h-5 w-5" strokeWidth={2} />
          </div>

          <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
            School website
          </span>
        </div>

        <p className="mt-7 text-[15px] leading-7 text-gray-700">
          “A lot of our parents are outside Nepal, so keeping them informed was
          always difficult. Having one school page for notices and updates has
          made communication much easier for us.”
        </p>

        <div className="mt-auto pt-8">
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                MT
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-gray-950">
                    Maya Tamang
                  </p>

                  <BadgeCheck
                    className="h-4 w-4 shrink-0 text-blue-600"
                    strokeWidth={2}
                  />
                </div>

                <p className="mt-0.5 text-xs text-gray-500">
                  Principal
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <School className="h-3.5 w-3.5" strokeWidth={1.8} />
                Everest Model Academy
              </span>

              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />
                Morang
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>

    <p className="mt-2 text-center text-xs text-gray-500 lg:hidden">Swipe to read more school stories</p>

    {/* Bottom trust line */}
    <div className="mt-10 flex justify-center">
      <p className="max-w-2xl text-center text-sm leading-6 text-gray-500">
        The best school software should feel simple enough to use every day,
        not like another system staff have to fight with.
      </p>
    </div>
  </div>
</section>

      {/* ===== Pricing ===== */}
<section
  id="pricing"
  className="nepsom-pattern-grid relative scroll-mt-24 overflow-hidden bg-gray-50/70 py-12 sm:py-20 lg:py-28"
>
  <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
        <Sparkles className="h-4 w-4" strokeWidth={1.8} />
        100% free for now
      </span>

      <h2 className="mt-5 text-[clamp(1.75rem,7.2vw,2.25rem)] leading-tight font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
        Use every NEPSOM feature.
        <span className="text-blue-600"> Pay nothing.</span>
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
        NEPSOM is completely free for schools during our early-access period.
        Register your school and use the full platform with no subscription or setup fee.
      </p>
    </div>

    <div className="mx-auto mt-10 max-w-3xl">
      <article className="relative overflow-hidden rounded-2xl border-2 border-blue-600 bg-white p-5 shadow-xl shadow-blue-600/10 sm:rounded-[28px] sm:p-9">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-100 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">
                Early access
              </p>
              <h3 className="mt-2 text-2xl font-bold text-gray-950">
                Full NEPSOM access
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                Available to every school, regardless of student count.
              </p>
            </div>

            <div className="shrink-0 sm:text-right">
              <div className="flex items-end gap-2 sm:justify-end">
                <span className="text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">NPR 0</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-green-700">100% free for now</p>
            </div>
          </div>

          <div className="my-7 h-px bg-gray-100" />

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              'Student and teacher management',
              'Attendance and fee records',
              'Exams, results and report cards',
              'Notices and communication',
              'Admissions and documents',
              'School website and accounts',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-sm text-gray-700">
                <Check className="h-4 w-4 shrink-0 text-green-600" strokeWidth={2.2} />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <Link
            href="/auth/signup"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            Register your school for free
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </article>
    </div>

    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-600">
      {['No subscription fee', 'No setup fee', 'All features included', 'Your data stays yours'].map((promise) => (
        <span key={promise} className="inline-flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" strokeWidth={2} />
          {promise}
        </span>
      ))}
    </div>
  </div>
</section>

{/* ===== FAQ ===== */}
<section id="faq" className="nepsom-pattern-grid relative scroll-mt-24 overflow-hidden py-12 sm:py-20 lg:py-24">
  <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
    {/* Header */}
    <div className="text-center">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 sm:text-sm">
        <CircleHelp className="h-4 w-4" aria-hidden="true" /> Common questions
      </span>
      <h2 className="text-[clamp(1.75rem,7.2vw,2.25rem)] font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
        Questions principals ask us
      </h2>
      <p className="mt-4 text-lg text-gray-600">
        Everything you need to know before getting started
      </p>
    </div>

    {/* FAQ Items */}
    <div className="mt-8 space-y-3 sm:mt-12 sm:space-y-4">
      {[
        [
          'Does it work on slow internet or mobile data?',
          'Yes. Pages are light and built to load on 3G/4G mobile data. If you can open Facebook, you can open NEPSOM.',
        ],
        [
          'Do teachers need a computer?',
          'No. Everything works from a phone browser. Teachers who can use Facebook can use NEPSOM on day one.',
        ],
        [
          "Is our school's data private?",
          'Yes. Each school is fully isolated. Another school can never see your students, fees or marks — that is built into the database, not just the design.',
        ],
        [
          'Can we use it in Nepali?',
          'Yes! We are actively adding full Nepali language support as a free update.',
        ],
        [
          'What if we stop paying?',
          'Your data stays yours. You can export students, marks and fee records at any time.',
        ],
      ].map(([q, a], i) => (
        <details key={i} className="group rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-blue-200">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:gap-4 sm:p-6">
            <span className="flex-1 text-base">{q}</span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-all group-open:bg-blue-600 group-open:text-white group-open:rotate-180">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div className="px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm leading-relaxed text-gray-600">{a}</p>
            </div>
          </div>
        </details>
      ))}
    </div>

    {/* Still have questions CTA */}
    <div className="mt-10 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 text-center sm:mt-16 sm:p-8">
      <h3 className="text-xl font-bold text-gray-900">Still have questions?</h3>
      <p className="mt-2 text-gray-600">We're here to help. Reach out anytime.</p>
      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <a
          href="https://wa.me/9779806532844?text=Hi%2C%20I%20have%20a%20question%20about%20NEPSOM"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-green-700"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          WhatsApp Us
        </a>
        <a
          href="tel:+9779806532844"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Call Us
        </a>
      </div>
    </div>
  </div>
</section>
      
      {/* ===== Final CTA ===== */}
      <section className="bg-blue-700 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Put your school on the map this term.
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Register your school, confirm your email, and start setting up your workspace.
          </p>
          <Link
            href="/auth/signup"
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 sm:w-auto"
          >
            Register your school — free
          </Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-gray-900 py-10 text-gray-400 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:gap-10 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3">
                <Image src="/logo4.png" alt="NEPSOM" width={895} height={223} sizes="180px" className="h-auto w-40 sm:w-44" />
              </div>
              <p className="mt-3 text-sm leading-relaxed">
                The school management platform built for Nepal.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Product</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">For schools</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/auth/signup" className="hover:text-white">Register your school</Link></li>
                <li><Link href="/auth/login" className="hover:text-white">Principal login</Link></li>
                <li><Link href="/s/ram-mandhir-deesecondary-school" className="hover:text-white">Demo school page</Link></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Contact</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="mailto:basantadigitalprod@gmail.com" className="inline-flex min-h-11 max-w-full items-center gap-2 break-all hover:text-white"><Mail className="h-4 w-4 shrink-0" aria-hidden="true" />basantadigitalprod@gmail.com</a></li>
                <li><a href="tel:+9779806532844" className="inline-flex min-h-11 items-center gap-2 hover:text-white"><Phone className="h-4 w-4 shrink-0" aria-hidden="true" />+977-9806532844</a></li>
                <li className="inline-flex min-h-11 items-center gap-2"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />Syangja, Nepal</li>
              </ul>
            </div>
          </div>
          <p className="mt-10 border-t border-gray-800 pt-6 text-center text-xs">
            © 2026 NEPSOM Nepal. All rights reserved.
          </p>
        </div>
      </footer>
      <WhatsAppButton />
    </main>
  );
}
