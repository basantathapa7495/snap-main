import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SchoolSearch from './SchoolSearch';

export default async function SchoolsPage() {
  const { data: schools, error } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-gray-900">
            Schools
          </h1>

          <p className="mt-4 text-red-600">
            Failed to load schools: {error.message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Schools
            </h1>

            <p className="mt-1 text-gray-600">
              Manage all registered schools in snap.
            </p>
          </div>

          <Link
            href="/schools/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            + Add School
          </Link>
        </div>

        {/* School count */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Schools
          </p>

          <p className="mt-1 text-3xl font-bold text-gray-900">
            {schools.length}
          </p>
        </div>

        {/* Search, filters and schools */}
        <SchoolSearch schools={schools} />

      </div>
    </main>
  );
}