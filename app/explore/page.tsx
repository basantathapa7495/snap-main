import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import LocationFilter from './LocationFilter';

export default async function ExplorePage() {
  const { data: schools, error } = await supabase
    .from('schools')
    .select(
      'id, name, school_type, address, municipality, district, province'
    )
    .order('name', { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-gray-900">
            Explore Schools
          </h1>

          <p className="mt-4 text-red-600">
            Failed to load schools: {error.message}
          </p>
        </div>
      </main>
    );
  }

  const groupedByProvince = schools.reduce(
    (acc, school) => {
      const province = school.province || 'Other';

      if (!acc[province]) {
        acc[province] = [];
      }

      acc[province].push(school);

      return acc;
    },
    {} as Record<string, typeof schools>
  );

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <Link
            href="/"
            className="text-2xl font-bold text-gray-900"
          >
            snap
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Login
            </Link>

            <Link
              href="/auth/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </div>

        </div>
      </header>

      {/* Hero */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Nepal School Directory
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Explore Schools Across Nepal
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
            Discover schools by province, district and municipality.
            Find useful public information about schools in your area.
          </p>

        </div>
      </section>

      {/* Statistics */}
      <section className="px-6">
        <div className="mx-auto max-w-6xl">

          <div className="grid gap-5 sm:grid-cols-3">

            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Schools
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {schools.length}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Provinces
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {Object.keys(groupedByProvince).length}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Directory
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                Nepal
              </p>
            </div>

          </div>

        </div>
      </section>

     {/* School Explorer */}
<section className="px-6 py-12">
  <div className="mx-auto max-w-6xl">

    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900">
        Find a School
      </h2>

      <p className="mt-2 text-gray-600">
        Start by choosing a province.
      </p>
    </div>

        <LocationFilter schools={schools} />

  </div>
</section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl text-center">

          <p className="font-semibold text-gray-900">
            snap
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Connecting schools, teachers, students and parents.
          </p>

        </div>
      </footer>

    </main>
  );
}