'use client';
import WhatsAppButton from '@/components/WhatsAppButton';
import LandingNavbar from '@/components/LandingNavbar';
import { useEffect, useState } from 'react';
import Link from 'next/link';
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
    { task: 'Make the monthly fee dues list', old: '3 days of manual work', nepsom: '10 seconds' },
    { task: 'Tell parents a notice', old: 'Paper gets lost in bags', nepsom: 'Instant on website' },
    { task: 'Prepare report cards', old: 'A week of calculation', nepsom: 'Print in minutes' },
    { task: 'Track attendance', old: 'Register & pen', nepsom: 'One tap, saved forever' },
    { task: "Know who hasn't paid", old: 'Ask every parent', nepsom: 'Dues report + phone no.' },
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
    <main className="bg-white text-gray-800 antialiased">
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
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:gap-12 sm:px-6 sm:py-16 md:grid-cols-2 md:py-24 lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
              Ready to take your school digital?
            </p>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              Run your whole school from one phone
            </h1>
            <p className="mt-5 max-w-prose text-base leading-relaxed text-gray-600 sm:text-lg">
              Attendance, fees, exams, reports, notices, students and teachers — manage from one place, without registers and endless photocopies.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup" className="w-full rounded-xl bg-blue-600 px-7 py-3.5 text-center font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 sm:w-auto">
                Register your school
              </Link>
              <a
                href="/s/sunrise-valley-secondary"
                target="_blank"
                className="w-full rounded-xl border-2 border-blue-600 bg-white px-6 py-3 text-center font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 sm:w-auto"
              >
                👀 See Live Demo
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              No credit card required · Setup in 10 minutes
            </p>
          </div>

          {/* Hero photo with floating cards */}
          <div className="relative">
  <img
    src="/hero-image.png"
    alt="NEPSOM school management platform for schools in Nepal"
    className="w-full rounded-3xl object-cover shadow-2xl"
    loading="eager"
  />
</div>
        </div>
      </section>

      {/* ===== Live schools ticker ===== */}
      {schools.length > 0 && (
  <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
    <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
      Schools already on NEPSOM
    </p>

    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
      {schools.slice(0, 6).map((s, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-700 shadow-sm"
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

      {/* ===== Problem → Solution ===== */}
<section className="relative overflow-hidden bg-white py-14 sm:py-20 lg:py-24">
  {/* Background decoration */}
  <div
    className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_65%)]"
    aria-hidden="true"
  />

  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Section heading */}
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
        From manual to simple
      </span>

      <h2 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
        School work should not take
        <span className="text-blue-600"> days of paperwork.</span>
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
        Registers, photocopies and repeated calculations slow everyone down.
        NEPSOM turns everyday school tasks into simple digital workflows.
      </p>
    </div>

    {/* Cards */}
    <div className="mt-14 grid gap-6 lg:grid-cols-3">
      {/* Card 1 */}
      <article className="group relative overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        {/* Image */}
        <div className="relative h-64 overflow-hidden bg-gray-100">
          <img
            src="/fees.png"
            alt="Fee management with NEPSOM"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

          <span className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600 shadow-md">
            01
          </span>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              The problem
            </p>
          </div>

          <h3 className="mt-3 text-xl font-bold text-gray-950">
            “Who hasn&apos;t paid fees?”
          </h3>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Staff spend hours checking registers and making dues lists by hand
            just to find unpaid students.
          </p>

          <div className="my-6 h-px bg-gray-100" />

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12l4 4L19 6"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-950">
                With NEPSOM
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                Open the Fee Dues Report and see unpaid students with parent
                contact details in seconds.
              </p>
            </div>
          </div>
        </div>
      </article>

      {/* Card 2 */}
      <article className="group relative overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        {/* Image */}
        <div className="relative h-64 overflow-hidden bg-gray-100">
          <img
            src="/notice.png"
            alt="School notices managed digitally with NEPSOM"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

          <span className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600 shadow-md">
            02
          </span>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              The problem
            </p>
          </div>

          <h3 className="mt-3 text-xl font-bold text-gray-950">
            “We didn&apos;t know about the notice.”
          </h3>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Paper notices get forgotten, damaged or lost before they ever reach
            parents.
          </p>

          <div className="my-6 h-px bg-gray-100" />

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12l4 4L19 6"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-950">
                With NEPSOM
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                Publish once and make important school notices available online
                from the school website.
              </p>
            </div>
          </div>
        </div>
      </article>

      {/* Card 3 */}
      <article className="group relative overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        {/* Image */}
        <div className="relative h-64 overflow-hidden bg-gray-100">
          <img
            src="/report.png"
            alt="Report cards generated with NEPSOM"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

          <span className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600 shadow-md">
            03
          </span>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              The problem
            </p>
          </div>

          <h3 className="mt-3 text-xl font-bold text-gray-950">
            “Report cards take a week.”
          </h3>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Teachers repeat calculations, check marks and prepare report cards
            one student at a time.
          </p>

          <div className="my-6 h-px bg-gray-100" />

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12l4 4L19 6"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-950">
                With NEPSOM
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                Enter marks once. NEPSOM calculates results and creates clean,
                printable report cards.
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>

    {/* Bottom message */}
    <div className="mt-12 flex justify-center">
      <div className="flex max-w-full items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-3 text-sm text-gray-700 sm:items-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5 shrink-0 text-blue-600"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v18M3 12h18"
          />
        </svg>

        <span className="min-w-0">
          And that&apos;s only the beginning —
          <strong className="font-semibold text-gray-950">
            {' '}
            attendance, admissions, exams, students and teachers
          </strong>{' '}
          are managed from the same place.
        </span>
      </div>
    </div>
  </div>
</section>

      {/* ===== Video Demo ===== */}
<section
  id="video"
  className="relative scroll-mt-24 overflow-hidden bg-gray-950 py-14 sm:py-20 lg:py-28"
>
  {/* Background decoration */}
  <div
    className="pointer-events-none absolute inset-0"
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

      <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
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

      {/* ===== How It Works ===== */}
<section
  id="how"
  className="relative scroll-mt-24 overflow-hidden bg-white py-14 sm:py-20 lg:py-28"
>
  {/* Background pattern */}
  <div
    className="pointer-events-none absolute inset-0 opacity-[0.035]"
    style={{
      backgroundImage:
        'radial-gradient(circle, #2563eb 1px, transparent 1px)',
      backgroundSize: '28px 28px',
    }}
    aria-hidden="true"
  />

  {/* Soft background glow */}
  <div
    className="pointer-events-none absolute left-1/2 top-20 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-100/60 blur-[120px]"
    aria-hidden="true"
  />

  <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Heading */}
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
        Simple setup
      </span>

      <h2 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
        Start using NEPSOM in
        <span className="text-blue-600"> three simple steps</span>
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
        No complicated installation. No technical team required. Set up your
        school, add your people, and start managing everything from one place.
      </p>
    </div>

    {/* Steps */}
    <div className="relative mt-16">
      {/* Desktop connecting line */}
      <div
        className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-blue-100 via-blue-300 to-blue-100 lg:block"
        aria-hidden="true"
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Step 1 */}
        <article className="group relative">
          <div className="relative rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl sm:p-7">
            {/* Number + Icon */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-transform duration-300 group-hover:scale-105">
                <School className="h-7 w-7" strokeWidth={1.8} />
              </div>

              <span className="text-5xl font-bold tracking-tight text-gray-100">
                01
              </span>
            </div>

            <div className="mt-7">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">
                Step 1
              </span>

              <h3 className="mt-2 text-xl font-bold text-gray-950">
                Register your school
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Create your school account and enter the basic school details.
                NEPSOM prepares your school workspace and public school page.
              </p>

              <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium text-gray-500">
                  Your school page
                </p>

                <p className="mt-1 truncate font-mono text-xs font-medium text-gray-800">
                  nepsom.xyz/s/your-school
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Step 2 */}
        <article className="group relative">
          <div className="relative rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl sm:p-7">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-transform duration-300 group-hover:scale-105">
                <Users className="h-7 w-7" strokeWidth={1.8} />
              </div>

              <span className="text-5xl font-bold tracking-tight text-gray-100">
                02
              </span>
            </div>

            <div className="mt-7">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">
                Step 2
              </span>

              <h3 className="mt-2 text-xl font-bold text-gray-950">
                Add teachers and students
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Add your classes, teachers, and students. Give each person the
                right access so school work is shared instead of depending on
                one person.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-gray-50 px-3 py-3">
                  <p className="text-xs font-semibold text-gray-900">
                    Teachers
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Class access
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 px-3 py-3">
                  <p className="text-xs font-semibold text-gray-900">
                    Students
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Personal portal
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Step 3 */}
        <article className="group relative">
          <div className="relative rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl sm:p-7">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-transform duration-300 group-hover:scale-105">
                <Link2 className="h-7 w-7" strokeWidth={1.8} />
              </div>

              <span className="text-5xl font-bold tracking-tight text-gray-100">
                03
              </span>
            </div>

            <div className="mt-7">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">
                Step 3
              </span>

              <h3 className="mt-2 text-xl font-bold text-gray-950">
                Start running your school
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Manage attendance, fees, exams, notices, students, and teachers
                from your dashboard while your school community uses their own
                secure access.
              </p>

              <div className="mt-6 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                <CheckCircle2
                  className="h-5 w-5 shrink-0 text-green-600"
                  strokeWidth={2}
                />

                <span className="text-sm font-semibold text-green-800">
                  Your school is ready to go
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    {/* Bottom simplified flow */}
    <div className="mx-auto mt-14 max-w-4xl">
      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-5 py-5 sm:px-7">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
          {/* Register */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-gray-200">
              <School className="h-4 w-4" strokeWidth={1.8} />
            </div>

            <span className="text-sm font-semibold text-gray-800">
              Register
            </span>
          </div>

          <ArrowRight
            className="h-4 w-4 rotate-90 text-gray-300 sm:rotate-0"
            aria-hidden="true"
          />

          {/* Add people */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-gray-200">
              <Users className="h-4 w-4" strokeWidth={1.8} />
            </div>

            <span className="text-sm font-semibold text-gray-800">
              Add people
            </span>
          </div>

          <ArrowRight
            className="h-4 w-4 rotate-90 text-gray-300 sm:rotate-0"
            aria-hidden="true"
          />

          {/* Start */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-gray-200">
              <Link2 className="h-4 w-4" strokeWidth={1.8} />
            </div>

            <span className="text-sm font-semibold text-gray-800">
              Start using NEPSOM
            </span>
          </div>

          <ArrowRight
            className="h-4 w-4 rotate-90 text-gray-300 sm:rotate-0"
            aria-hidden="true"
          />

          {/* Done */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600 ring-1 ring-green-100">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            </div>

            <span className="text-sm font-semibold text-green-700">
              Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

     {/* ===== ⚖️ COMPARISON TABLE ===== */}
<section className="relative py-14 sm:py-20 lg:py-24 overflow-hidden">
  {/* Subtle background gradient */}
  <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white pointer-events-none"></div>
  
  <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <div className="text-center">
      <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600 mb-4 ring-1 ring-inset ring-red-100">
        ⚖️ Honest Comparison
      </span>
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
        NEPSOM vs <span className="text-red-500">Manual Registers</span>
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
        See exactly how much time and effort your school saves every single day.
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

    {/* Mobile Cards (visible only on small screens) */}
    <div className="mt-10 space-y-4 sm:hidden">
      {compareRows.map((r, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-xs font-bold text-blue-600">
              {i + 1}
            </span>
            <h3 className="font-bold text-gray-900">{r.task}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-500 uppercase mb-1">Old Way</p>
              <p className="text-xs text-red-700 line-through">{r.old}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">NEPSOM</p>
              <p className="text-xs font-semibold text-emerald-700">{r.nepsom}</p>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Bottom Summary */}
    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
  className="relative scroll-mt-24 overflow-hidden bg-white py-14 sm:py-20 lg:py-28"
>
  {/* Background decoration */}
  <div
    className="pointer-events-none absolute inset-0 opacity-[0.03]"
    style={{
      backgroundImage:
        'radial-gradient(circle, #2563eb 1px, transparent 1px)',
      backgroundSize: '28px 28px',
    }}
    aria-hidden="true"
  />

  <div
    className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-blue-100/70 blur-[120px]"
    aria-hidden="true"
  />

  <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Heading */}
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
        <Sparkles className="h-4 w-4" strokeWidth={1.8} />
        Complete solution
      </span>

      <h2 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
        Everything your school needs,
        <span className="text-blue-600"> in one place</span>
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
        Manage students, attendance, fees, exams, notices, and more without
        switching between registers, spreadsheets, and separate systems.
      </p>
    </div>

    {/* Features grid */}
    <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

                <p className="mt-2 text-xs leading-5 text-gray-600">
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
<section className="relative overflow-hidden bg-white py-14 sm:py-20 lg:py-28">
  {/* Background glow */}
  <div
    className="pointer-events-none absolute left-1/2 top-0 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-blue-100/60 blur-[120px]"
    aria-hidden="true"
  />

  <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Heading */}
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
        <Quote className="h-4 w-4" strokeWidth={1.8} />
        School stories
      </span>

      <h2 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
        What school leaders say
        <span className="text-blue-600"> about NEPSOM</span>
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
        Simple tools matter most when they make everyday school work less tiring.
      </p>
    </div>

    {/* Cards */}
    <div className="mt-14 grid gap-6 lg:grid-cols-3">
      {/* Testimonial 1 */}
      <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-blue-200 bg-blue-50/40 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <Quote className="h-5 w-5" strokeWidth={2} />
          </div>

          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
            Fees
          </span>
        </div>

        <p className="mt-7 text-[15px] leading-7 text-gray-700">
          “Before NEPSOM, we had to check several registers just to know who still
          had fees due. Now I can see the list in one place and call parents
          directly. It saves a lot of unnecessary back-and-forth.”
        </p>

        <div className="mt-auto pt-8">
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
      <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl sm:p-7">
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
      <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl sm:p-7">
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
  className="relative scroll-mt-24 overflow-hidden bg-gray-50/70 py-14 sm:py-20 lg:py-28"
>
  <div
    className="pointer-events-none absolute inset-0 opacity-[0.035]"
    style={{
      backgroundImage: 'radial-gradient(circle, #2563eb 1px, transparent 1px)',
      backgroundSize: '28px 28px',
    }}
    aria-hidden="true"
  />
  <div
    className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-100 blur-[120px]"
    aria-hidden="true"
  />

  <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
        <Sparkles className="h-4 w-4" strokeWidth={1.8} />
        100% free for now
      </span>

      <h2 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
        Use every NEPSOM feature.
        <span className="text-blue-600"> Pay nothing.</span>
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
        NEPSOM is completely free for schools during our early-access period.
        Register your school and use the full platform with no subscription or setup fee.
      </p>
    </div>

    <div className="mx-auto mt-10 max-w-3xl">
      <article className="relative overflow-hidden rounded-[28px] border-2 border-blue-600 bg-white p-6 shadow-xl shadow-blue-600/10 sm:p-9">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-100 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
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
                <span className="text-5xl font-bold tracking-tight text-gray-950">NPR 0</span>
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
<section id="faq" className="scroll-mt-24">
  {/* Subtle background pattern */}
  <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
  
  <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
    {/* Header */}
    <div className="text-center">
      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 mb-4">
        💬 Common Questions
      </span>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
        Questions principals ask us
      </h2>
      <p className="mt-4 text-lg text-gray-600">
        Everything you need to know before getting started
      </p>
    </div>

    {/* FAQ Items */}
    <div className="mt-12 space-y-4">
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
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 font-semibold text-gray-900">
            <span className="flex-1 text-base">{q}</span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-all group-open:bg-blue-600 group-open:text-white group-open:rotate-180">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div className="px-6 pb-6">
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm leading-relaxed text-gray-600">{a}</p>
            </div>
          </div>
        </details>
      ))}
    </div>

    {/* Still have questions CTA */}
    <div className="mt-16 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 text-center">
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
      <section className="bg-blue-700 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Put your school on the map this term.
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Register in 2 minutes. Your school's website is live before the tea gets cold.
          </p>
          <Link
            href="/auth/signup"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 font-semibold text-blue-700 hover:bg-blue-50"
          >
            Register your school — free
          </Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-gray-900 py-12 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <img src="/logo1.png" alt="NEPSOM logo" className="h-10 w-auto" />
                <img src="/logo4.png" alt="NEPSOM school management platform" className="h-10 w-auto" />
              </div>
              <p className="mt-3 text-sm leading-relaxed">
                The school management platform built for Nepal. Made with ❤️ in Nepal.
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
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Contact</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li>📧 basantadigitalprod@gmail.com</li>
                <li>📞 +977-9806532844</li>
                <li>📍 Syangja, Nepal</li>
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
