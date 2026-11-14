import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ClipboardCheck,
  FilePenLine,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Mail,
  Megaphone,
  Minus,
  Phone,
  Plus,
  UserRoundCheck,
  Users,
  WalletCards,
} from 'lucide-react';
import LandingNavbar from '@/components/LandingNavbar';
import styles from './landing.module.css';

const features = [
  { name: 'Students', description: 'Records, classes and admissions.', icon: Users },
  { name: 'Teachers', description: 'Staff, assignments and leave.', icon: UserRoundCheck },
  { name: 'Attendance', description: 'Daily records for students and staff.', icon: ClipboardCheck },
  { name: 'Fees', description: 'Payments, dues and receipts.', icon: WalletCards },
  { name: 'Exams & Results', description: 'Marks, grades and report cards.', icon: FilePenLine },
  { name: 'Communication', description: 'Notices and school messages.', icon: Megaphone },
  { name: 'Reports', description: 'Academic, attendance and fee reports.', icon: BarChart3 },
  { name: 'School Website', description: 'School information and updates online.', icon: Globe },
];

const portals = [
  {
    name: 'Principal portal',
    eyebrow: 'School oversight',
    icon: LayoutDashboard,
    description: 'See daily priorities and manage people, attendance, fees and school operations.',
  },
  {
    name: 'Teacher portal',
    eyebrow: 'Classroom work',
    icon: BookOpen,
    description: 'Manage assigned classes, take attendance and record student marks.',
  },
  {
    name: 'Student portal',
    eyebrow: 'Learning access',
    icon: GraduationCap,
    description: 'Follow assignments, attendance, results and important school notices.',
  },
];

const comparisons = [
  { task: 'Attendance', manual: 'Count entries across paper registers.', nepsom: 'Mark and review attendance by class.' },
  { task: 'Fees', manual: 'Search registers for payments and dues.', nepsom: 'See payments and outstanding dues together.' },
  { task: 'Notices', manual: 'Print and distribute every notice.', nepsom: 'Publish one update to the right audience.' },
  { task: 'Results', manual: 'Compile marks and prepare cards by hand.', nepsom: 'Enter marks and prepare report cards.' },
];

const steps = [
  { title: 'Register your school', description: 'Create an account and add your school details.' },
  { title: 'Add your people', description: 'Set up classes, teachers and students.' },
  { title: 'Manage daily work', description: 'Start with attendance, fees, notices or results.' },
];

const faqs = [
  {
    question: 'Can I use NEPSOM on my phone?',
    answer: 'Yes. NEPSOM works in modern phone, tablet and computer browsers. There is no app to install. An internet connection is required to load and save school information.',
  },
  {
    question: 'Is NEPSOM free?',
    answer: 'NEPSOM is free for now. You can register a school and begin using the available features without a subscription payment.',
  },
  {
    question: 'How do teachers get access?',
    answer: 'Teachers use their own accounts. A school can create their access or enable teacher joining with a school code and teacher join code. Joining requests require approval.',
  },
  {
    question: 'What do I need to get started?',
    answer: 'Register with your email and school details, verify your email, then add classes, teachers and students. No server or special software is required.',
  },
  {
    question: 'Who can access our school information?',
    answer: 'School workspaces require an account and access depends on each person’s role. Only information intentionally published on a school website is public. Contact NEPSOM below for privacy questions.',
  },
];

const container = 'mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8';
const heading = 'text-[27px] font-semibold leading-[1.18] tracking-[-0.025em] text-[#0F172A] sm:text-[34px]';
const sectionCopy = 'mt-3 max-w-xl text-sm leading-6 text-[#64748B] sm:text-[15px] sm:leading-7';
const primaryButton = 'inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]';

function RegisterLink({ className = '' }: { className?: string }) {
  return (
    <Link href="/auth/signup" prefetch={false} className={`${primaryButton} ${className}`}>
      Register your school
      <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className={`${styles.home} nepsom-home bg-white text-[#0F172A] antialiased`}>
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-lg bg-white p-3 text-sm font-semibold focus:not-sr-only focus:fixed focus:left-4 focus:top-2"
      >
        Skip to content
      </a>
      <LandingNavbar />

      <main id="main-content" tabIndex={-1} className={styles.gridBackground}>
        <section aria-labelledby="hero-heading">
          <div className={`${container} flex flex-col items-start pb-4 pt-4 text-left sm:pb-8 sm:pt-6 lg:pb-10 lg:pt-7`}>
            <div className="w-full max-w-[920px]">
              <p className="-ml-1 inline-flex h-8 items-center gap-2 rounded-full bg-[#EFF6FF] px-3.5 text-xs font-semibold text-[#1E40AF]">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#2563EB]" aria-hidden="true" />
                Made for Nepal's schools for now
              </p>

              <h1
                id="hero-heading"
                className="mt-2 text-[46px] font-extrabold leading-[0.99] tracking-[-0.045em] text-[#071A3D] sm:text-[56px] lg:text-[64px]"
              >
                <span className="block">Run your school</span>
                <span className="block">
                  from{' '}
                  <span className={styles.heroAccent}>
                    one place
                    <span className={styles.heroRays} aria-hidden="true" />
                  </span>
                  .
                </span>
              </h1>

              <p className="mt-3 max-w-[780px] text-[18px] font-medium leading-[1.5] text-[#475569] sm:text-[21px]">
                Less paperwork. More teaching.
              </p>
              <p className="mt-2 max-w-[780px] text-sm leading-6 text-[#475569] sm:text-base">
                Mark attendance in seconds. Track fee dues instantly. Print report cards in a few clicks.
              </p>

              <Link
                href="/auth/signup"
                prefetch={false}
                className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#3B82F6] px-5 text-white transition-colors hover:bg-[#2563EB]"
              >
                <span className="text-base font-bold">Register your school</span>
                <ArrowRight className="ml-auto h-5 w-5 shrink-0" strokeWidth={2.3} aria-hidden="true" />
              </Link>

              <figure className={`${styles.heroFrame} -mx-4 mt-4 w-[calc(100%+2rem)] max-w-none overflow-hidden border-y border-[#E2E8F0] bg-[#F8FAFC] sm:mx-0 sm:w-full sm:max-w-[920px] sm:rounded-xl sm:border`}>
                <div className={styles.heroPhoto}>
                  <Image
                    src="/hero-img.png"
                    alt="School administrator using NEPSOM on her phone"
                    width={1536}
                    height={1024}
                    sizes="(max-width: 639px) 100vw, 920px"
                    preload
                    className={styles.heroImage}
                  />
                </div>
              </figure>
            </div>
          </div>
        </section>

        <section id="features" aria-labelledby="features-heading" className={`${container} -mt-2 scroll-mt-20 pb-12 pt-0 sm:mt-0 sm:pb-[72px] sm:pt-10`}>
          <div className="mb-7 sm:mb-9">
            <div className="flex items-center gap-3">
              <span className="h-7 w-1 shrink-0 rounded-full bg-[#2563EB]" aria-hidden="true" />
              <h2 id="features-heading" className={heading}>Your school’s everyday tasks.</h2>
            </div>
            <p className="mt-3 text-sm font-medium text-[#475569]">Daily work, organized in one place.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {features.map(({ name, description, icon: Icon }) => (
              <article key={name} className={`${styles.featureCard} h-full rounded-[10px] border border-[#E2E8F0] bg-white p-3.5 sm:p-5`}>
                <span className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] sm:mb-5">
                  <Icon className="h-[18px] w-[18px] text-[#2563EB]" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold leading-5 sm:text-[15px]">{name}</h3>
                <p className="mt-1.5 text-[12.5px] leading-[1.55] text-[#64748B] sm:text-[13px]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="portals" aria-labelledby="portals-heading" className="scroll-mt-20 border-y border-[#E2E8F0] bg-[#F8FAFC] py-12 sm:py-[72px]">
          <div className={container}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2563EB]">Connected access</p>
            <h2 id="portals-heading" className={`${heading} mt-2.5`}>One school. Three clear portals.</h2>
            <p className={sectionCopy}>Each person sees the tools and information they need for their part of the school day.</p>

            <div className="mt-7 grid gap-3 sm:mt-9 md:grid-cols-3 md:gap-4">
              {portals.map(({ name, eyebrow, icon: Icon, description }) => (
                <article key={name} className={`${styles.portalCard} rounded-[10px] border border-[#E2E8F0] bg-white p-4 sm:p-5`}>
                  <div className="flex items-start gap-3.5 md:block">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] md:mb-5">
                      <Icon className="h-5 w-5 text-[#0F172A]" strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">{eyebrow}</p>
                      <h3 className="mt-1 text-[16px] font-semibold leading-6">{name}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-[#64748B] md:mt-4">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="comparison-heading" className={`${container} py-12 sm:py-[72px]`}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2563EB]">Manual vs NEPSOM</p>
          <h2 id="comparison-heading" className={`${heading} mt-2.5`}>Less searching. A clearer school day.</h2>
          <p className={sectionCopy}>Keep familiar school work organized without adding a complicated process.</p>

          <div className="mt-7 grid gap-3 sm:mt-9 md:grid-cols-2 md:gap-4">
            {comparisons.map(({ task, manual, nepsom }) => (
              <article key={task} className="overflow-hidden rounded-[10px] border border-[#E2E8F0] bg-white">
                <h3 className="border-b border-[#E2E8F0] px-4 py-3 text-sm font-semibold sm:px-5">{task}</h3>
                <dl className="text-[13px] leading-5">
                  <div className="grid grid-cols-[78px_1fr] gap-3 bg-[#F8FAFC] px-4 py-3 sm:grid-cols-[88px_1fr] sm:px-5">
                    <dt className="flex items-start gap-1.5 font-medium text-[#64748B]">
                      <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      Manual
                    </dt>
                    <dd className="text-[#64748B]">{manual}</dd>
                  </div>
                  <div className="grid grid-cols-[78px_1fr] gap-3 border-t border-[#E2E8F0] px-4 py-3 sm:grid-cols-[88px_1fr] sm:px-5">
                    <dt className="flex items-start gap-1.5 font-semibold text-[#2563EB]">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
                      NEPSOM
                    </dt>
                    <dd className="font-medium text-[#334155]">{nepsom}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section id="how" aria-labelledby="how-heading" className="scroll-mt-20 border-y border-[#E2E8F0] bg-[#F8FAFC] py-12 sm:py-[72px]">
          <div className={container}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2563EB]">How it works</p>
            <h2 id="how-heading" className={`${heading} mt-2.5`}>Start in three simple steps.</h2>

            <ol className={`${styles.steps} mt-7 grid gap-5 sm:mt-9 md:grid-cols-3 md:gap-8`}>
              {steps.map(({ title, description }, index) => (
                <li key={title} className="relative flex gap-3.5 md:block">
                  <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-[#475569] md:mb-4" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold leading-6">{title}</h3>
                    <p className="mt-1 text-[13px] leading-6 text-[#64748B]">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" aria-labelledby="faq-heading" className={`${container} scroll-mt-20 py-12 sm:py-[72px]`}>
          <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2563EB]">FAQ</p>
              <h2 id="faq-heading" className={`${heading} mt-2.5`}>Before you get started.</h2>
              <p className={sectionCopy}>The essentials school leaders usually ask us first.</p>
            </div>
            <div className="border-t border-[#E2E8F0]">
              {faqs.map(({ question, answer }) => (
                <details key={question} name="landing-faq" className="group border-b border-[#E2E8F0]">
                  <summary className="flex min-h-[58px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold leading-6">
                    {question}
                    <Plus className="h-4 w-4 shrink-0 text-[#64748B] transition-transform group-open:rotate-45" aria-hidden="true" />
                  </summary>
                  <p className="max-w-2xl pb-5 pr-7 text-[13px] leading-6 text-[#64748B] sm:text-sm">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="cta-heading" className="border-y border-[#E2E8F0] bg-[#F8FAFC] py-10 sm:py-12">
          <div className={`${container} flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-10`}>
            <div>
              <h2 id="cta-heading" className="text-[25px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]">Ready to organize your school day?</h2>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">Set up your school workspace and begin with the work that matters today.</p>
            </div>
            <RegisterLink className="shrink-0" />
          </div>
        </section>
      </main>

      <footer className={`${styles.gridBackground} ${container} py-8 sm:py-10`}>
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
          <div>
            <Link href="/" aria-label="NEPSOM home" className="inline-flex min-h-11 items-center">
              <Image src="/logo2.png" alt="NEPSOM" width={1035} height={241} sizes="132px" className="h-auto w-[132px]" />
            </Link>
            <p className="mt-1.5 max-w-xs text-sm leading-6 text-[#64748B]">School management, made for Nepal.</p>
          </div>
          <address className="text-sm not-italic text-[#64748B] sm:justify-self-end">
            <a href="mailto:basantadigitalprod@gmail.com" className="flex min-h-10 items-center gap-2 hover:text-[#2563EB]">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="break-all">basantadigitalprod@gmail.com</span>
            </a>
            <a href="tel:+9779806532910" className="flex min-h-10 items-center gap-2 hover:text-[#2563EB]">
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              +977 9806532910
            </a>
            <p className="mt-1">Syangja, Nepal</p>
          </address>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-t border-[#E2E8F0] pt-4 text-xs text-[#64748B]">
          <p>© {new Date().getFullYear()} NEPSOM. All rights reserved.</p>
          <a href="#faq" className="inline-flex min-h-10 items-center hover:text-[#2563EB]">
            Common questions
            <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </footer>
    </div>
  );
}
