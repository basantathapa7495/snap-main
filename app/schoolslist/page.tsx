import Link from 'next/link';

const schools = [
  {
    id: 1,
    name: 'Sunrise Valley Secondary School',
    slug: 'sunrise-valley-secondary',
    location: 'Pokhara, Kaski',
    type: 'Secondary School',
    students: 842,
    verified: true,
  },
  {
    id: 2,
    name: 'Shree Janajyoti School',
    slug: 'shree-janajyoti-school',
    location: 'Syangja, Gandaki',
    type: 'Basic School',
    students: 516,
    verified: true,
  },
  {
    id: 3,
    name: 'Everest Academy',
    slug: 'everest-academy',
    location: 'Kathmandu, Bagmati',
    type: 'Secondary School',
    students: 1094,
    verified: true,
  },
  {
    id: 4,
    name: 'Himalayan Public School',
    slug: 'himalayan-public-school',
    location: 'Butwal, Lumbini',
    type: 'Secondary School',
    students: 678,
    verified: false,
  },
  {
    id: 5,
    name: 'Green Valley English School',
    slug: 'green-valley-english-school',
    location: 'Chitwan, Bagmati',
    type: 'Basic School',
    students: 423,
    verified: true,
  },
  {
    id: 6,
    name: 'Shree Pragati Secondary School',
    slug: 'shree-pragati-secondary-school',
    location: 'Dharan, Koshi',
    type: 'Secondary School',
    students: 731,
    verified: true,
  },
];

export default function SchoolListPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
              Schools on SNAP
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
              Discover schools powered by SNAP
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600">
              Explore schools using SNAP to manage their administration and
              build a stronger digital presence.
            </p>

            <div className="mx-auto mt-8 max-w-xl">
              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 20l-4-4"
                  />
                </svg>

                <input
                  type="search"
                  placeholder="Search school name or location..."
                  className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-100 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div className="px-4 text-center">
            <p className="text-2xl font-bold text-gray-950">6+</p>
            <p className="mt-1 text-sm text-gray-500">Schools listed</p>
          </div>

          <div className="px-4 text-center">
            <p className="text-2xl font-bold text-gray-950">4K+</p>
            <p className="mt-1 text-sm text-gray-500">Students represented</p>
          </div>

          <div className="hidden px-4 text-center lg:block">
            <p className="text-2xl font-bold text-gray-950">6</p>
            <p className="mt-1 text-sm text-gray-500">Locations</p>
          </div>

          <div className="hidden px-4 text-center lg:block">
            <p className="text-2xl font-bold text-blue-600">Growing</p>
            <p className="mt-1 text-sm text-gray-500">SNAP community</p>
          </div>
        </div>
      </section>

      {/* School list */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              School directory
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-950">
              Explore schools
            </h2>
          </div>

          <select
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            defaultValue="all"
            aria-label="Filter schools"
          >
            <option value="all">All schools</option>
            <option value="secondary">Secondary</option>
            <option value="basic">Basic</option>
            <option value="primary">Primary</option>
          </select>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {schools.map((school) => (
            <article
              key={school.id}
              className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Placeholder school header */}
              <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="absolute right-4 top-4">
                  {school.verified && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>

                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-10 w-10 text-blue-600"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 21h18M5 21V9l7-4 7 4v12M9 21v-5h6v5M8 11h.01M12 11h.01M16 11h.01"
                    />
                  </svg>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold leading-6 text-gray-950">
                      {school.name}
                    </h3>

                    <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 21s6-5.1 6-11a6 6 0 10-12 0c0 5.9 6 11 6 11z"
                        />
                        <circle cx="12" cy="10" r="2" />
                      </svg>

                      <span>{school.location}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {school.type}
                  </span>

                  <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {school.students.toLocaleString()} students
                  </span>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-5">
                  <Link
                    href={`/s/${school.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    View school
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
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
            </article>
          ))}
        </div>
      </section>

      {/* School CTA */}
      <section className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 rounded-3xl bg-blue-600 px-6 py-10 text-center sm:px-10 lg:flex-row lg:text-left">
            <div>
              <p className="text-sm font-semibold text-blue-100">
                Run a school?
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Bring your school online with SNAP
              </h2>

              <p className="mt-3 max-w-2xl text-blue-100">
                Manage your school and get your own professional public school
                website from one platform.
              </p>
            </div>

            <Link
              href="/auth/signup"
              className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Register your school
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}