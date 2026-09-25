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
  Check, 
  CalendarDays,
  PlayCircle,
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

    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <NepalIcon className="h-4 w-4 text-blue-200" />
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
        <span className="text-emerald-600">NEPSOM</span> vs <span className="text-red-500">Manual Registers</span>
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

    {/* Minimal feature grid */}
    <div className="mt-7 grid grid-cols-3 gap-2.5 sm:mt-10 sm:gap-4 lg:gap-5">
      {[
        { icon: Users, title: 'Students' },
        { icon: ClipboardCheck, title: 'Attendance' },
        { icon: WalletCards, title: 'Fees' },
        { icon: FilePenLine, title: 'Exams' },
        { icon: FileText, title: 'Report cards' },
        { icon: Megaphone, title: 'Notices' },
        { icon: Inbox, title: 'Admissions' },
        { icon: Cake, title: 'Birthdays' },
        { icon: GraduationCap, title: 'Teachers' },
        { icon: UserRound, title: 'Student portal' },
        { icon: LayoutDashboard, title: 'Dashboard' },
        { icon: Palette, title: 'School website' },
        { icon: CalendarDays, title: 'Calendar' },
        { icon: Mail, title: 'Messages' },
        { icon: Phone, title: 'Parent contacts' },
        { icon: MapPin, title: 'Locations' },
        { icon: School, title: 'Classes' },
        { icon: Link2, title: 'Documents' },
      ].map(({ icon: Icon, title }) => (
        <article
          key={title}
          className="group flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-3 text-center shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50 sm:min-h-[112px] sm:rounded-2xl sm:gap-3 sm:px-3 sm:py-5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-colors group-hover:bg-blue-600 group-hover:text-white sm:h-11 sm:w-11">
            <Icon className="h-5 w-5 sm:h-5 sm:w-5" strokeWidth={1.8} />
          </span>
          <h3 className="text-[11px] font-semibold leading-tight text-gray-900 sm:text-sm">
            {title}
          </h3>
        </article>
      ))}
    </div>

    {/* Bottom message */}
    <div className="mt-10 flex justify-center sm:mt-12">
      <p className="whitespace-nowrap text-center text-xs font-semibold text-gray-700 sm:text-lg">
        One login. One dashboard. One connected school system.
      </p>
    </div>
  </div>
</section>

      

      {/* ===== School stories ===== */}
      <section className="bg-slate-50 py-10 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase text-blue-600">Reviews</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-950 sm:text-3xl">
              What school leaders say
            </h2>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              {
                review: 'Before NEPSOM, checking unpaid fees meant going through several registers. Now the full dues list is ready in one place, which saves us a lot of time.',
                image: '/review1.jpg',
                name: 'Sunita Gurung',
                role: 'Principal',
                school: 'Shree Himalaya Secondary',
                location: 'Kaski',
              },
              {
                review: 'I was worried our teachers might find a new system difficult. They learned the attendance feature quickly and now use it every morning without help.',
                image: '/review2.jpg',
                name: 'Ram Bahadur Thapa',
                role: 'Vice Principal',
                school: 'Janata Basic School',
                location: 'Udayapur',
              },
              {
                review: 'Sharing notices with parents used to take too much effort. Now we publish one update and parents can read it directly from the school page.',
                image: '/review3.jpg',
                name: 'Maya Tamang',
                role: 'Principal',
                school: 'Everest Model Academy',
                location: 'Morang',
              },
            ].map((story) => (
              <article
                key={story.name}
                className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div
                  className="text-base tracking-[0.12em] text-amber-500"
                  aria-label="5 out of 5 stars"
                >
                  ★★★★★
                </div>

                <blockquote className="mt-3 flex-1 text-sm leading-6 text-gray-700">
                  &ldquo;{story.review}&rdquo;
                </blockquote>

                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <Image
                    src={story.image}
                    alt={`${story.name}, ${story.role}`}
                    width={88}
                    height={88}
                    sizes="44px"
                    className="h-11 w-11 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-slate-200"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-950">{story.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {story.role}, {story.school}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{story.location}, Nepal</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

{/* ===== FAQ ===== */}
      <section id="faq" className="scroll-mt-24 bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase text-blue-600">Common questions</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-950 sm:text-3xl">
              Before your school gets started
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
              Clear answers to the questions school leaders ask most.
            </p>
          </div>

          <div className="mt-7 overflow-hidden rounded-lg border border-slate-200 bg-white sm:mt-8">
            {[
              [
                'Does NEPSOM work on a phone and mobile data?',
                'Yes. NEPSOM works in a phone browser and is designed for everyday mobile use. No app installation is required.',
              ],
              [
                'Do teachers need a computer?',
                'No. Teachers can use their own phone to mark attendance, view school information and complete their assigned work.',
              ],
              [
                'Do we need technical knowledge to set it up?',
                'No. Register the school, add your teachers and students, and start using the dashboard. No server or software installation is needed.',
              ],
              [
                "Is our school's data private?",
                'Yes. School records are protected by account access, and each school can only access its own students, staff, fees and results.',
              ],
              [
                'What can our school manage with NEPSOM?',
                'You can manage students, teachers, classes, attendance, fees, admissions, exams, notices, documents and your school website.',
              ],
              [
                'Is Nepali language available?',
                'The main interface is currently in English. Nepali language support is being added as the platform develops.',
              ],
            ].map(([question, answer]) => (
              <details
                key={question}
                className="group border-b border-slate-200 last:border-b-0"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-5 sm:text-base">
                  <span>{question}</span>
                  <span
                    className="text-xl font-normal leading-none text-blue-600 group-open:hidden"
                    aria-hidden="true"
                  >
                    +
                  </span>
                  <span
                    className="hidden text-xl font-normal leading-none text-blue-600 group-open:inline"
                    aria-hidden="true"
                  >
                    -
                  </span>
                </summary>
                <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                  <p className="border-t border-slate-100 pt-3 text-sm leading-6 text-gray-600">
                    {answer}
                  </p>
                </div>
              </details>
            ))}
          </div>

          <p className="mt-5 text-center text-sm text-gray-600">
            Have another question?{' '}
            <a
              href="https://wa.me/9779806532910?text=Hi%2C%20I%20have%20a%20question%20about%20NEPSOM"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Ask us on WhatsApp
            </a>
          </p>
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
      <footer className="border-t-4 border-blue-600 bg-slate-950 text-slate-400">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="grid gap-6 md:grid-cols-[0.7fr_1fr_1.3fr] md:gap-8">
            <div className="grid grid-cols-2 gap-4 md:contents">
              <nav aria-label="Product links">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Product</h3>
                <ul className="mt-2 space-y-0 text-sm">
                  <li>
                    <a href="#features" className="inline-flex min-h-8 items-center hover:text-white">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="inline-flex min-h-8 items-center hover:text-white">
                      Questions
                    </a>
                  </li>
                </ul>
              </nav>

              <nav aria-label="School links">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">For schools</h3>
                <ul className="mt-2 space-y-0 text-sm">
                  <li>
                    <Link href="/auth/signup" className="inline-flex min-h-8 items-center hover:text-white">
                      Register
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/login" className="inline-flex min-h-8 items-center hover:text-white">
                      Principal login
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>

            <div className="border-t border-slate-800 pt-4 md:border-t-0 md:pt-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Contact</h3>
              <ul className="mt-2 space-y-0 text-sm">
                <li>
                  <a
                    href="mailto:basantadigitalprod@gmail.com"
                    className="flex min-h-8 items-center gap-2.5 break-all hover:text-white"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                    basantadigitalprod@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+9779806532910"
                    className="flex min-h-8 items-center gap-2.5 hover:text-white"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                    +977 9806532910
                  </a>
                </li>
                <li className="flex min-h-8 items-center gap-2.5">
                  <MapPin className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                  Syangja, Nepal
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center text-xs text-slate-500 md:text-left">
            © 2026 NEPSOM. All rights reserved.
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </main>
  );
}
