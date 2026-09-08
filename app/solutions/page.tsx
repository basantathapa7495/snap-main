import Link from 'next/link';

const solutions = [
  {
    title: 'For Principals',
    description:
      'See the whole school from one dashboard and make faster decisions without chasing registers or spreadsheets.',
    items: [
      'School overview and health score',
      'Attendance monitoring',
      'Fee collection tracking',
      'Admissions management',
      'Teacher and student management',
      'Reports and school insights',
    ],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l8 4-8 4-8-4 8-4z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 10v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"
        />
      </svg>
    ),
  },
  {
    title: 'For Teachers',
    description:
      'Give teachers simple tools to manage their daily work without paperwork slowing them down.',
    items: [
      'Mark attendance',
      'View assigned classes',
      'Manage students',
      'Enter marks',
      'View notices',
      'Access teaching information',
    ],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
        />
        <circle cx="9" cy="7" r="4" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 8v6M16 11h6"
        />
      </svg>
    ),
  },
  {
    title: 'For Students',
    description:
      'Students can see the information that matters to them from one secure portal.',
    items: [
      'Attendance overview',
      'Fee payment history',
      'Exam information',
      'Results and grades',
      'School notices',
      'Personal profile',
    ],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 14l9-5-9-5-9 5 9 5z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 12v5c2 2 4.5 3 7 3s5-1 7-3v-5"
        />
      </svg>
    ),
  },
];

const workflows = [
  {
    title: 'Attendance',
    description:
      'Replace paper attendance registers with faster digital attendance and clear history.',
  },
  {
    title: 'Fees & Receipts',
    description:
      'Record payments, track collections and generate professional receipts from one place.',
  },
  {
    title: 'Exams & Results',
    description:
      'Manage exams, enter marks and prepare student results without repeating manual calculations.',
  },
  {
    title: 'Admissions',
    description:
      'Accept applications online and convert approved applications directly into student records.',
  },
  {
    title: 'Communication',
    description:
      'Publish notices and important school information so everyone stays informed.',
  },
  {
    title: 'School Website',
    description:
      'Give your school a professional public website with news, programs, gallery and contact information.',
  },
];

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_35%)]" />

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
              One platform for your whole school
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
              Simple school management for everyone
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              SNAP connects principals, teachers and students in one simple
              platform built to make everyday school management easier.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
              >
                Register your school
              </Link>

              <Link
                href="/#video"
                className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
              >
                Watch demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Role solutions */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Built for every role
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            One school. One connected system.
          </h2>

          <p className="mt-4 text-lg leading-8 text-gray-600">
            Everyone gets the tools they need without making the system
            complicated.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {solutions.map((solution) => (
            <article
              key={solution.title}
              className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                {solution.icon}
              </div>

              <h3 className="mt-6 text-xl font-bold text-gray-950">
                {solution.title}
              </h3>

              <p className="mt-3 leading-7 text-gray-600">
                {solution.description}
              </p>

              <ul className="mt-6 space-y-3">
                {solution.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-gray-700"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.293a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L8.5 12.086l6.793-6.793a1 1 0 011.411 0z"
                        clipRule="evenodd"
                      />
                    </svg>

                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Workflow solutions */}
      <section className="border-y border-gray-100 bg-gray-50/70">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Everyday school work
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Replace repetitive school work with simpler workflows
            </h2>

            <p className="mt-4 text-lg text-gray-600">
              SNAP brings important school operations together instead of
              spreading them across registers, spreadsheets and separate apps.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <div
                key={workflow.title}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
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
                  </span>

                  <h3 className="font-bold text-gray-950">
                    {workflow.title}
                  </h3>
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {workflow.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nepal focused */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-gray-950 px-6 py-12 text-white sm:px-10 lg:px-14 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
                Built for Nepal
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Designed around the way Nepali schools actually work
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-gray-300">
                From Nepal&apos;s location structure to NPR fee management and
                mobile-first access, SNAP is being built specifically for
                schools in Nepal.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                'Province → District → Municipality → Ward',
                'NPR-based fee management',
                'Works across phone and desktop',
                'School-specific public websites',
                'Principal, teacher and student portals',
                'Designed for simple daily use',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex gap-3">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="mt-0.5 h-5 w-5 shrink-0 text-blue-400"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.293a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L8.5 12.086l6.793-6.793a1 1 0 011.411 0z"
                        clipRule="evenodd"
                      />
                    </svg>

                    <span className="text-sm text-gray-200">{item}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-gray-100 bg-blue-50/60">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            Ready to simplify your school?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Bring students, teachers, attendance, fees, exams and school
            communication into one connected system.
          </p>

          <div className="mt-8">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Register your school
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="ml-2 h-4 w-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a1 1 0 011-1h9.586l-3.293-3.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 11H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}