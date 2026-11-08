import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, BookOpen, ClipboardCheck, FilePenLine, Globe, GraduationCap, LayoutDashboard, Mail, Megaphone, Phone, Plus, Users, UserRoundCheck, WalletCards } from 'lucide-react';
import LandingNavbar from '@/components/LandingNavbar';
import styles from './landing.module.css';

const features = [
  { name: 'Students', description: 'Student records, classes and admissions.', icon: Users },
  { name: 'Teachers', description: 'Staff records, assignments and leave.', icon: UserRoundCheck },
  { name: 'Attendance', description: 'Daily attendance for students and staff.', icon: ClipboardCheck },
  { name: 'Fees', description: 'Payments, outstanding dues and receipts.', icon: WalletCards },
  { name: 'Exams & Results', description: 'Marks, grades and printable report cards.', icon: FilePenLine },
  { name: 'Communication', description: 'School notices and messages in one place.', icon: Megaphone },
  { name: 'Reports', description: 'Attendance, academic and financial reports.', icon: BarChart3 },
  { name: 'School Website', description: 'Your school’s information and updates online.', icon: Globe },
];
const portals = [
  { name: 'Principal', icon: LayoutDashboard, description: 'Oversee your school’s people, attendance, fees and daily priorities.' },
  { name: 'Teacher', icon: BookOpen, description: 'Manage assigned classes, mark attendance and enter student marks.' },
  { name: 'Student', icon: GraduationCap, description: 'Keep up with assignments, attendance, results and school notices.' },
];
const comparisons = [
  { task: 'Attendance', manual: 'Count entries in paper registers.', nepsom: 'Mark attendance and review it by class.' },
  { task: 'Fees', manual: 'Search registers for payments and dues.', nepsom: 'See payments and outstanding dues together.' },
  { task: 'Notices', manual: 'Print and distribute each notice.', nepsom: 'Publish updates for your school community.' },
  { task: 'Results', manual: 'Compile marks and prepare cards by hand.', nepsom: 'Enter marks and prepare printable report cards.' },
];
const steps = [
  { title: 'Register your school.', description: 'Create your account and add your school details.' },
  { title: 'Add teachers and students.', description: 'Set up your classes and connect your school community.' },
  { title: 'Start managing daily work.', description: 'Take attendance, record fees and share your first notice.' },
];
const faqs = [
  { question: 'Can I use NEPSOM on my phone?', answer: 'Yes. Open NEPSOM in your phone, tablet or computer browser. No app installation is needed. You’ll need an internet connection to load and save school information.' },
  { question: 'Is NEPSOM free?', answer: 'NEPSOM is free for now. You can register your school and start using the platform without a subscription payment.' },
  { question: 'How do teachers get access?', answer: 'Teachers use their own accounts. Your school can provide login details or enable teacher joining with a school code and teacher join code. Joining requests need approval before teachers can access the portal.' },
  { question: 'What do I need to get started?', answer: 'Register with your email and school details, verify your email, then add your classes, teachers and students. There’s no software or server to install.' },
  { question: 'Who can access our school’s information?', answer: 'School workspaces require an account, with access based on the user’s role. Information published on your school website is public. For questions about data handling or privacy, contact NEPSOM using the email below.' },
];
const container = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';
const heading = 'text-[26px] font-semibold leading-tight tracking-tight text-[#0F172A] sm:text-[32px]';
const primaryButton = 'inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700';

function RegisterLink({ className = '' }: { className?: string }) {
  return <Link href="/auth/signup" prefetch={false} className={`${primaryButton} ${className}`}>Register your school <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>;
}

export default function HomePage() {
  return (
    <div className={`${styles.home} nepsom-home bg-white text-[#0F172A] antialiased`}>
      <a href="#main-content" className="sr-only z-[60] rounded-lg bg-white p-3 text-sm font-semibold focus:not-sr-only focus:fixed focus:left-4 focus:top-2">Skip to content</a>
      <LandingNavbar />
      <main id="main-content" tabIndex={-1}>
        <section aria-labelledby="hero-heading" className="border-b border-[#E2E8F0]">
          <div className={`${container} grid items-center gap-7 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-16`}>
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#64748B]">Built for Nepali schools</p>
              <h1 id="hero-heading" className="mt-3 max-w-[15ch] text-[38px] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-5xl lg:text-[54px]">Run your school from one place.</h1>
              <p className="mt-4 max-w-md text-[15px] leading-6 text-[#64748B] sm:text-base sm:leading-7">Bring students, teachers, attendance, fees and results together. Less paperwork for your team. More time for your school.</p>
              <RegisterLink className="mt-6 w-full sm:w-auto" />
              <p className="mt-3 text-center text-xs leading-5 text-[#64748B] sm:text-left">Free for now · No installation needed</p>
            </div>
            <figure className="min-w-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              {/* Existing editorial asset, cropped to exclude its illustrative UI and old branding. */}
              <div className={styles.heroPhoto}>
                <Image src="/hero-image.png" alt="Illustration of a school administrator using her phone in a school office" width={1536} height={1024} sizes="(max-width: 639px) 210vw, (max-width: 1023px) 180vw, 1050px" preload className={styles.heroImage} />
              </div>
              <figcaption className="flex items-center justify-between gap-3 border-t border-[#E2E8F0] bg-white px-4 py-3 text-xs text-[#64748B]"><span>School work, wherever you are.</span><span className="shrink-0 font-medium text-[#0F172A]">NEPSOM</span></figcaption>
            </figure>
          </div>
        </section>

        <section id="features" aria-labelledby="features-heading" className={`${container} scroll-mt-20 py-12 sm:py-16`}>
          <div className="mb-6 max-w-xl sm:mb-8"><h2 id="features-heading" className={heading}>The essentials, together.</h2><p className="mt-3 text-sm leading-6 text-[#64748B] sm:text-base">One workspace for the work that keeps your school running.</p></div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {features.map(({ name, description, icon: Icon }) => (
              <article key={name} className="rounded-[10px] border border-[#E2E8F0] bg-white p-4 sm:p-5">
                <Icon className="mb-4 h-5 w-5 text-[#2563EB]" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="text-sm font-semibold leading-5 sm:text-base">{name}</h3><p className="mt-2 text-[13px] leading-5 text-[#64748B] sm:text-sm">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="portals" aria-labelledby="portals-heading" className="scroll-mt-20 border-y border-[#E2E8F0] bg-[#F8FAFC] py-12 sm:py-16">
          <div className={container}>
            <h2 id="portals-heading" className={heading}>One school. Three connected portals.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#64748B] sm:text-base">A clear workspace for each person’s part in the school day.</p>
            <div className="mt-6 grid gap-3 sm:mt-8 md:grid-cols-3 md:gap-4">
              {portals.map(({ name, icon: Icon, description }) => (
                <article key={name} className="flex items-start gap-4 rounded-[10px] border border-[#E2E8F0] bg-white p-4 md:block md:p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F8FAFC] md:mb-5"><Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" /></span>
                  <div><h3 className="text-base font-semibold">{name}</h3><p className="mt-1.5 text-sm leading-6 text-[#64748B]">{description}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="comparison-heading" className={`${container} py-12 sm:py-16`}>
          <h2 id="comparison-heading" className={heading}>Less manual work. A clearer school day.</h2><p className="mt-3 text-sm leading-6 text-[#64748B] sm:text-base">See what changes when everyday work moves into NEPSOM.</p>
          <div className="mt-6 grid overflow-hidden rounded-[10px] border border-[#E2E8F0] sm:mt-8 md:grid-cols-2">
            {comparisons.map(({ task, manual, nepsom }, index) => (
              <article key={task} className={`p-4 sm:p-5 ${index < 3 ? 'border-b border-[#E2E8F0]' : ''} ${index === 2 ? 'md:border-b-0' : ''} ${index % 2 === 0 ? 'md:border-r md:border-[#E2E8F0]' : ''}`}>
                <h3 className="mb-3 text-base font-semibold">{task}</h3>
                <dl className="space-y-3 text-sm leading-6">
                  <div><dt className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Manual</dt><dd className="text-[#64748B]">{manual}</dd></div>
                  <div><dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0F172A]">With NEPSOM</dt><dd>{nepsom}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section id="how" aria-labelledby="how-heading" className="scroll-mt-20 border-y border-[#E2E8F0] bg-[#F8FAFC] py-12 sm:py-16">
          <div className={container}>
            <h2 id="how-heading" className={heading}>Start with three simple steps.</h2>
            <ol className="mt-6 grid gap-6 sm:mt-8 md:grid-cols-3 md:gap-8">
              {steps.map(({ title, description }, index) => (
                <li key={title} className="flex gap-4 md:block"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#64748B] md:mb-4" aria-hidden="true">0{index + 1}</span><div><h3 className="text-base font-semibold leading-6">{title}</h3><p className="mt-1.5 text-sm leading-6 text-[#64748B]">{description}</p></div></li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" aria-labelledby="faq-heading" className={`${container} scroll-mt-20 py-12 sm:py-16`}>
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div><h2 id="faq-heading" className={heading}>Before you get started.</h2><p className="mt-3 text-sm leading-6 text-[#64748B]">A few things school leaders often ask.</p></div>
            <div className="border-t border-[#E2E8F0]">
              {faqs.map(({ question, answer }) => (
                <details key={question} name="landing-faq" className="group border-b border-[#E2E8F0]">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold leading-6">{question}<Plus className="h-4 w-4 shrink-0 text-[#64748B] group-open:rotate-45" aria-hidden="true" /></summary>
                  <p className="pb-5 pr-5 text-sm leading-6 text-[#64748B]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="cta-heading" className="border-y border-[#E2E8F0] bg-[#F8FAFC] py-9 sm:py-12">
          <div className={`${container} flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8`}><div><h2 id="cta-heading" className="text-2xl font-semibold leading-tight tracking-tight sm:text-[30px]">Make room for what matters.</h2><p className="mt-2 text-sm leading-6 text-[#64748B]">Bring your school’s daily work into one place.</p></div><RegisterLink className="shrink-0" /></div>
        </section>
      </main>

      <footer className={`${container} py-8`}>
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
          <div><Link href="/" aria-label="NEPSOM home" className="inline-flex min-h-11 items-center"><Image src="/logo2.png" alt="NEPSOM" width={1035} height={241} sizes="136px" className="h-auto w-[136px]" /></Link><p className="mt-2 max-w-xs text-sm leading-6 text-[#64748B]">School management, made for Nepal.</p></div>
          <address className="text-sm not-italic text-[#64748B] sm:justify-self-end">
            <a href="mailto:basantadigitalprod@gmail.com" className="flex min-h-11 items-center gap-2 hover:text-[#2563EB]"><Mail className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="break-all">basantadigitalprod@gmail.com</span></a>
            <a href="tel:+9779806532910" className="flex min-h-11 items-center gap-2 hover:text-[#2563EB]"><Phone className="h-4 w-4 shrink-0" aria-hidden="true" />+977 9806532910</a><p className="mt-1">Syangja, Nepal</p>
          </address>
        </div>
        {/* Add legal navigation only when genuine public policy routes exist. */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-[#E2E8F0] pt-4 text-xs text-[#64748B]"><p>© {new Date().getFullYear()} NEPSOM. All rights reserved.</p><a href="#faq" className="inline-flex min-h-11 items-center hover:text-[#2563EB]">Questions? Start here <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden="true" /></a></div>
      </footer>
    </div>
  );
}
