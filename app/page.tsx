'use client';
import WhatsAppButton from '@/components/WhatsAppButton';
import LandingNavbar from '@/components/LandingNavbar';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [yearly, setYearly] = useState(false);

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

  const plans = [
    { label: 'Up to 200 students', monthly: 300, popular: false },
    { label: '201–500 students', monthly: 500, popular: true },
    { label: '501–1,000 students', monthly: 800, popular: false },
    { label: '1,000+ students', monthly: 1000, popular: false },
  ];

  const compareRows = [
    { task: 'Make the monthly fee dues list', old: '3 days of manual work', snap: '10 seconds' },
    { task: 'Tell parents a notice', old: 'Paper gets lost in bags', snap: 'Instant on website' },
    { task: 'Prepare report cards', old: 'A week of calculation', snap: 'Print in minutes' },
    { task: 'Track attendance', old: 'Register & pen', snap: 'One tap, saved forever' },
    { task: "Know who hasn't paid", old: 'Ask every parent', snap: 'Dues report + phone no.' },
  ];

  return (
    <main className="bg-white text-gray-800 antialiased">
      {/* ===== Trust Badges Bar ===== */}
      <div className="bg-blue-700 px-4 py-2.5 text-center text-xs font-medium text-white sm:text-sm">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1">🔒 Data Secure</span>
          <span className="hidden sm:inline text-blue-300">|</span>
          <span className="flex items-center gap-1">🇳🇵 Made in Nepal</span>
          <span className="hidden sm:inline text-blue-300">|</span>
          <span className="flex items-center gap-1">📱 Works on Any Phone</span>
          <span className="hidden sm:inline text-blue-300">|</span>
          <span className="flex items-center gap-1">💰 No Hidden Fees</span>
        </div>
      </div>

      {/* ===== Navbar ===== */}
      <LandingNavbar />

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
              Ready to take your school digital?
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl">
              Run your whole school from one phone
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-gray-600">
              Attendance, fees, exams, reports, notices, students and teachers — manage from one place, without registers and endless photocopies.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup" className="rounded-xl bg-blue-600 px-7 py-3.5 text-center font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">
                Register your school
              </Link>
              <a
                href="/s/sunrise-valley-secondary"
                target="_blank"
                className="rounded-xl border-2 border-blue-600 bg-white px-6 py-3 text-center font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
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
              src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=80"
              alt="Students raising their hands in a classroom in Nepal"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
              loading="eager"
            />
            <div className="absolute -bottom-5 -left-4 rounded-xl border border-gray-100 bg-white p-4 shadow-lg sm:-left-8">
              <p className="text-xs text-gray-500">Today's attendance — Class 5A</p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                38 / 40 present <span className="text-sm font-semibold text-green-600">95%</span>
              </p>
            </div>
            <div className="absolute -top-5 -right-3 rounded-xl border border-gray-100 bg-white p-4 shadow-lg sm:-right-6">
              <p className="text-xs text-gray-500">Monthly fee collected</p>
              <p className="mt-1 text-lg font-bold text-green-700">NPR 1,24,500</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Live schools ticker ===== */}
      {schools.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
            Schools already on SNAP
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {schools.map((s, i) => (
              <span key={i} className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-700 shadow-sm">
                🏫 {s.name}
                {s.district ? ` · ${s.district}` : ''}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ===== Problem → Solution ===== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Still running the school on registers and photocopies?
          </h2>
          <p className="mt-4 text-lg text-gray-600">Every month it's the same story. We built SNAP to change it.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Card 1: Fees */}
          <div className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">"Who hasn't paid fees?"</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                You spend 3 days making a dues list by hand. With SNAP, open the Fee Dues Report and see every unpaid student — with the parent's phone number — in 10 seconds.
              </p>
            </div>
            <img
              src="/fees.png"
              alt="Fee dues list made easy with SNAP"
              className="aspect-[3/4] w-20 shrink-0 self-start rounded-xl object-cover md:w-32"
              loading="lazy"
            />
          </div>

          {/* Card 2: Notice Board */}
          <div className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">"Parents say 'we didn't know.'" </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Paper notices get lost in school bags. Post once, and every parent reads it on the school's own website — even from abroad.
              </p>
            </div>
            <img
              src="/notice.png"
              alt="School notice board on the school website"
              className="aspect-[3/4] w-20 shrink-0 self-start rounded-xl object-cover md:w-32"
              loading="lazy"
            />
          </div>

          {/* Card 3: Report Card */}
          <div className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">"Report cards take a week."</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Enter marks once. SNAP calculates percentage, grade and GPA the Nepal way — and prints a clean report card you can save as PDF.
              </p>
            </div>
            <img
              src="/report.png"
              alt="Report card generated in seconds"
              className="aspect-[3/4] w-20 shrink-0 self-start rounded-xl object-cover md:w-32"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ===== 🎥 VIDEO DEMO (PREMIUM UPGRADE!) ===== */}
<section id="video" className="relative overflow-hidden bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 py-24">
  {/* Background glow effect */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none"></div>
  
  <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
    {/* Badge */}
    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-500/20">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
      </span>
      Live Product Preview
    </div>

    {/* Heading */}
    <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
      See SNAP in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Action</span>
    </h2>
    <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
      Watch how principals, teachers, and students use SNAP to run their school effortlessly in just 2 minutes.
    </p>

    {/* Premium Video Container */}
    <div className="group relative mx-auto mt-12 max-w-4xl rounded-2xl bg-gray-800/50 p-2 ring-1 ring-white/10 shadow-2xl backdrop-blur-sm transition-all duration-500 hover:shadow-indigo-500/20 hover:ring-indigo-500/30">
      {/* Fake Browser/Window Top Bar */}
      <div className="flex items-center gap-2 rounded-t-xl bg-gray-900/80 px-4 py-3 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
          <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
        </div>
        <div className="mx-auto flex-1 text-center text-xs font-medium text-gray-500">
          snap.com.np/demo
        </div>
      </div>
      
      {/* Video Iframe */}
      <div className="overflow-hidden rounded-b-xl bg-black">
        <iframe
          className="aspect-video w-full"
          src="https://www.youtube.com/embed/nigWHG_TH2U?rel=0&modestbranding=1"
          title="SNAP Demo Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
      
      {/* Subtle glow behind the container on hover */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-0 blur transition duration-500 group-hover:opacity-20 -z-10"></div>
    </div>
  </div>
</section>

      {/* ===== How it works ===== */}
<section id="how" className="relative bg-gray-50 py-24 overflow-hidden">
  {/* Subtle background pattern */}
  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
  
  <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 mb-4">
        Simple & Fast
      </span>
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
        How it works for your school
      </h2>
      <p className="mt-4 text-lg text-gray-600 sm:text-xl">
        Three simple steps. No computer needed. No IT person needed.
      </p>
    </div>

    <div className="mt-16 grid gap-8 md:grid-cols-3">
      {/* Step 1 */}
      <div className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200">
        <div className="absolute -top-6 left-8 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
          🏫
        </div>
        <div className="mt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Step 1</span>
          <h3 className="mt-2 text-xl font-bold text-gray-900">Register your school</h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Enter your school name and district. Takes 2 minutes. Your school instantly gets its own web link — like <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">/s/balkalyan-secondary</span>.
          </p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200">
        <div className="absolute -top-6 left-8 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
          👥
        </div>
        <div className="mt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Step 2</span>
          <h3 className="mt-2 text-xl font-bold text-gray-900">Add your people</h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Add classes, teachers, and students. Create logins for teachers with one click. Each teacher manages their own class — the work is shared, not on one person.
          </p>
        </div>
      </div>

      {/* Step 3 */}
      <div className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200">
        <div className="absolute -top-6 left-8 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
          🚀
        </div>
        <div className="mt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Step 3</span>
          <h3 className="mt-2 text-xl font-bold text-gray-900">Share your link</h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Parents read notices on your school page. Students and teachers log in and see only their own data. You see everything from your dashboard.
          </p>
        </div>
      </div>
    </div>

    {/* Enhanced Visual flow diagram */}
    <div className="mt-20">
      <div className="relative mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:gap-4">
          {/* Item 1 */}
          <div className="flex flex-col items-center text-center sm:flex-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl ring-4 ring-white">🏫</div>
            <p className="mt-3 text-sm font-bold text-gray-900">Register</p>
            <p className="text-xs text-gray-500">2 minutes</p>
          </div>
          
          {/* Arrow 1 */}
          <div className="hidden text-gray-300 sm:block">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>
          <div className="block text-gray-300 sm:hidden rotate-90">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>

          {/* Item 2 */}
          <div className="flex flex-col items-center text-center sm:flex-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl ring-4 ring-white">👥</div>
            <p className="mt-3 text-sm font-bold text-gray-900">Add People</p>
            <p className="text-xs text-gray-500">One click</p>
          </div>

          {/* Arrow 2 */}
          <div className="hidden text-gray-300 sm:block">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>
          <div className="block text-gray-300 sm:hidden rotate-90">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>

          {/* Item 3 */}
          <div className="flex flex-col items-center text-center sm:flex-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl ring-4 ring-white">📱</div>
            <p className="mt-3 text-sm font-bold text-gray-900">Share Link</p>
            <p className="text-xs text-gray-500">Instant access</p>
          </div>

          {/* Arrow 3 */}
          <div className="hidden text-gray-300 sm:block">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>
          <div className="block text-gray-300 sm:hidden rotate-90">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>

          {/* Item 4 */}
          <div className="flex flex-col items-center text-center sm:flex-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl ring-4 ring-white">✅</div>
            <p className="mt-3 text-sm font-bold text-green-700">Done!</p>
            <p className="text-xs text-gray-500">Ready to go</p>
          </div>
        </div>
        
        {/* Connecting line for desktop */}
        <div className="absolute left-0 right-0 top-1/2 hidden -translate-y-1/2 px-12 sm:block">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        </div>
      </div>
    </div>
  </div>
</section>

     {/* ===== ⚖️ COMPARISON TABLE ===== */}
<section className="relative py-24 overflow-hidden">
  {/* Subtle background gradient */}
  <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white pointer-events-none"></div>
  
  <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <div className="text-center">
      <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600 mb-4 ring-1 ring-inset ring-red-100">
        ⚖️ Honest Comparison
      </span>
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
        SNAP vs <span className="text-red-500">Manual Registers</span>
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
                  SNAP
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
                    {r.snap}
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
              <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">SNAP</p>
              <p className="text-xs font-semibold text-emerald-700">{r.snap}</p>
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
          <p className="text-sm font-bold text-green-800">With SNAP</p>
          <p className="text-xs text-green-600">Minutes, not hours. Less paperwork. Fewer mistakes. Better organized.</p>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* ===== Features (COMPACT) ===== */}
<section id="features" className="bg-gray-50 py-16">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700 mb-3">
        ✨ Complete Solution
      </span>
      <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
        Everything in one place
      </h2>
      <p className="mt-3 text-gray-600">
        All the tools your school needs — no more juggling multiple systems.
      </p>
    </div>

    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ['👨‍🎓', 'Students', 'Full profiles with class, section, roll no and parent contact.'],
        ['📋', 'Attendance', 'Mark whole class in one tap. Filter by date, class and section.'],
        ['💰', 'Fees & Receipts', 'Record payments and print receipts. See dues instantly.'],
        ['📝', 'Exams & Marks', 'Enter marks subject-wise. Auto-calculate percentage and grades.'],
        ['📄', 'Report Cards', 'Clean, printable report cards with GPA. Save as PDF.'],
        ['📢', 'Notice Board', 'Post once. Everyone sees it — parents, teachers, students.'],
        ['📥', 'Online Admissions', 'Parents apply online. Approve with one click.'],
        ['🎂', 'Birthday Alerts', 'See today\'s and upcoming birthdays at a glance.'],
        ['👩‍🏫', 'Teacher Portal', 'Teachers see their classes, mark attendance, enter marks.'],
        ['🎓', 'Student Portal', 'Students check attendance, fees, download receipts.'],
        ['📊', 'Smart Dashboard', 'See everything at a glance — attendance, fees, alerts.'],
        ['🎨', 'Custom Branding', 'Your logo, colors, and theme. Professional and unique.'],
      ].map(([icon, title, desc], i) => (
        <div key={i} className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xl group-hover:bg-indigo-100 transition-colors">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      

      {/* ===== Testimonials ===== */}
<section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
  <div className="mx-auto max-w-2xl text-center">
    <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Success Stories</p>
    <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
      What school leaders say about SNAP
    </h2>
    <p className="mt-4 text-lg text-gray-600">
      Real feedback from principals who transformed their school management.
    </p>
  </div>
  
  <div className="mt-12 grid gap-8 md:grid-cols-3">
    {/* Card 1 */}
    <div className="relative rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="absolute -top-4 left-8 text-6xl text-blue-100 select-none">❝</div>
      <p className="relative z-10 text-sm leading-relaxed text-gray-700 italic">
        "Before, making the fee dues list took 3 days of manual work every month. Now, I just open the Dues Report and know exactly who to call. It paid for itself in the very first month."
      </p>
      <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 font-bold text-white shadow-md">
          SG
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900">Sunita Gurung</p>
            <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-gray-500">Principal · Shree Himalaya Secondary, Kaski</p>
        </div>
      </div>
    </div>

    {/* Card 2 */}
    <div className="relative rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="absolute -top-4 left-8 text-6xl text-green-100 select-none">❝</div>
      <p className="relative z-10 text-sm leading-relaxed text-gray-700 italic">
        "Our teachers used to be scared of 'software'. But since they already use Facebook on their phones, this was incredibly easy to learn. Now, attendance is marked before the first bell even rings."
      </p>
      <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 font-bold text-white shadow-md">
          RT
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900">Ram Bahadur Thapa</p>
            <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-gray-500">Vice Principal · Janata Basic School, Udayapur</p>
        </div>
      </div>
    </div>

    {/* Card 3 */}
    <div className="relative rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="absolute -top-4 left-8 text-6xl text-purple-100 select-none">❝</div>
      <p className="relative z-10 text-sm leading-relaxed text-gray-700 italic">
        "Many of our parents work abroad — in Qatar, Korea, or Malaysia. Being able to open the school's webpage and instantly see notices and their child's report card means everything to them."
      </p>
      <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 font-bold text-white shadow-md">
          MT
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900">Maya Tamang</p>
            <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-gray-500">Principal · Everest Model Academy, Morang</p>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* ===== Pricing ===== */}
<section id="pricing" className="bg-gray-50 py-20">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Heading */}
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
        Simple pricing for every school
      </h2>
      <p className="mt-4 text-lg text-gray-600">
        Start free. Upgrade as your school grows. No hidden fees.
      </p>
    </div>

    {/* Billing toggle */}
    <div className="mt-10 flex justify-center">
      <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => setYearly(false)}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            !yearly ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setYearly(true)}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
            yearly ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Yearly
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            yearly ? 'bg-green-400 text-green-950' : 'bg-green-100 text-green-700'
          }`}>
            −35%
          </span>
        </button>
      </div>
    </div>

    {/* Pricing cards */}
    <div className="mt-12 grid gap-6 lg:grid-cols-4">
      {/* FREE */}
      <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">Free</p>
          <p className="mt-4 text-4xl font-extrabold text-gray-900">
            NPR 0
            <span className="text-base font-medium text-gray-500">/forever</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">Perfect to get started</p>
        </div>
        <ul className="mt-6 flex-1 space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>School website</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Up to 50 students</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Notice board</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Principal login</span>
          </li>
          <li className="flex items-start gap-2 text-gray-400">
            <span>✗</span>
            <span>Attendance tracking</span>
          </li>
          <li className="flex items-start gap-2 text-gray-400">
            <span>✗</span>
            <span>Fee management</span>
          </li>
          <li className="flex items-start gap-2 text-gray-400">
            <span>✗</span>
            <span>Exams & report cards</span>
          </li>
        </ul>
        <Link
          href="/auth/signup"
          className="mt-6 block rounded-lg border border-blue-600 py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50"
        >
          Start free
        </Link>
      </div>

      {/* BASIC - 200 students */}
      <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Basic</p>
          <p className="mt-4 text-4xl font-extrabold text-gray-900">
            {yearly ? (
              <>
                NPR {Math.round(300 * 0.65).toLocaleString()}
                <span className="text-base font-medium text-gray-500">/month</span>
              </>
            ) : (
              <>
                NPR 300
                <span className="text-base font-medium text-gray-500">/month</span>
              </>
            )}
          </p>
          {yearly ? (
            <p className="mt-2 text-sm text-gray-500">
              <span className="line-through">NPR 300</span> · billed NPR {(300 * 12 * 0.65).toLocaleString()}/year
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">billed monthly</p>
          )}
          <p className="mt-2 text-xs font-semibold text-blue-600">Up to 200 students</p>
        </div>
        <ul className="mt-6 flex-1 space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Everything in Free</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Up to 200 students</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Attendance tracking</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Teacher & student logins</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Basic reports</span>
          </li>
          <li className="flex items-start gap-2 text-gray-400">
            <span>✗</span>
            <span>Fee management</span>
          </li>
          <li className="flex items-start gap-2 text-gray-400">
            <span>✗</span>
            <span>Exams & report cards</span>
          </li>
        </ul>
        <Link
          href="/auth/signup"
          className="mt-6 block rounded-lg border border-blue-600 py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50"
        >
          Get started
        </Link>
      </div>

      {/* MEDIUM - 500 students (POPULAR) */}
      <div className="relative flex flex-col rounded-2xl border-2 border-blue-600 bg-white p-6 shadow-lg">
        <p className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
          MOST POPULAR
        </p>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Medium</p>
          <p className="mt-4 text-4xl font-extrabold text-gray-900">
            {yearly ? (
              <>
                NPR {Math.round(500 * 0.65).toLocaleString()}
                <span className="text-base font-medium text-gray-500">/month</span>
              </>
            ) : (
              <>
                NPR 500
                <span className="text-base font-medium text-gray-500">/month</span>
              </>
            )}
          </p>
          {yearly ? (
            <p className="mt-2 text-sm text-gray-500">
              <span className="line-through">NPR 500</span> · billed NPR {(500 * 12 * 0.65).toLocaleString()}/year
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">billed monthly</p>
          )}
          <p className="mt-2 text-xs font-semibold text-blue-600">Up to 500 students</p>
        </div>
        <ul className="mt-6 flex-1 space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Everything in Basic</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Up to 500 students</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Fee management & receipts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Exams & marks entry</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Report cards (PDF)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Online admissions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Priority support</span>
          </li>
        </ul>
        <Link
          href="/auth/signup"
          className="mt-6 block rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
        >
          Get started
        </Link>
      </div>

      {/* ENTERPRISE - 1000+ students */}
      <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-700">Enterprise</p>
          <p className="mt-4 text-4xl font-extrabold text-gray-900">
            Custom
          </p>
          <p className="mt-2 text-sm text-gray-500">For large schools</p>
          <p className="mt-2 text-xs font-semibold text-blue-600">1000+ students</p>
        </div>
        <ul className="mt-6 flex-1 space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Everything in Medium</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Unlimited students</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Custom branding</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Advanced analytics</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Dedicated support</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>On-site training</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Custom integrations</span>
          </li>
        </ul>
        <a
          href="https://wa.me/9779806532844?text=Hi%2C%20I%20want%20to%20know%20about%20SNAP%20Enterprise%20plan%20for%20my%20school"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block rounded-lg bg-green-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-700"
        >
          💬 Contact Us
        </a>
      </div>
    </div>

    {/* Savings message */}
    {yearly && (
      <p className="mt-6 text-center text-sm font-medium text-green-700">
        🎉 Save 35% with annual billing
      </p>
    )}

    {/* The promise line */}
    <p className="mt-12 text-center text-base font-medium text-gray-700">
      No setup fee · Cancel anytime · Your data is always yours
    </p>
  </div>
</section>

{/* ===== FAQ ===== */}
<section id="faq" className="relative bg-gradient-to-b from-gray-50 to-white py-24">
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
          'Yes. Pages are light and built to load on 3G/4G mobile data. If you can open Facebook, you can open SNAP.',
        ],
        [
          'Do teachers need a computer?',
          'No. Everything works from a phone browser. Teachers who can use Facebook can use SNAP on day one.',
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
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href="https://wa.me/9779806532844?text=Hi%2C%20I%20have%20a%20question%20about%20SNAP"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-green-700"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          WhatsApp Us
        </a>
        <a
          href="tel:+9779806532844"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
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
                <img src="/logo3.png" alt="SNAP logo" className="h-10 w-auto" />
                <img src="/logo4.png" alt="SNAP – School Nepal Administration Platform" className="h-10 w-auto" />
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
            © 2026 SNAP Nepal. All rights reserved.
          </p>
        </div>
      </footer>
      <WhatsAppButton />
    </main>
  );
}