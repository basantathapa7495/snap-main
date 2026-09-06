import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type SchoolPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SchoolDetailsPage({
  params,
}: SchoolPageProps) {
  const { id } = await params;

  const { data: school, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !school) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Back */}
        <Link
          href="/schools"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Schools
        </Link>

        {/* Header */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                {school.school_type || 'School'}
              </p>

              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                {school.name}
              </h1>

              <p className="mt-3 text-gray-600">
                📍 {school.address || 'Address not available'}
              </p>
            </div>

            <Link
              href={`/schools/${school.id}/edit`}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
            >
              Edit School
            </Link>
          </div>
        </div>

        {/* Basic Information */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            School Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">

            <InfoItem
              label="School Type"
              value={school.school_type}
            />

            <InfoItem
              label="Established Year"
              value={school.established_year}
            />

            <InfoItem
              label="Principal"
              value={school.principal}
            />

          </div>
        </section>

        {/* Location */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Location
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">

            <InfoItem
              label="Address"
              value={school.address}
            />

            <InfoItem
              label="Municipality"
              value={school.municipality}
            />

            <InfoItem
              label="Ward"
              value={school.ward}
            />

            <InfoItem
              label="District"
              value={school.district}
            />

            <InfoItem
              label="Province"
              value={school.province}
            />

          </div>
        </section>

        {/* Contact */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Contact Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">

            <InfoItem
              label="Phone"
              value={school.phone}
            />

            <InfoItem
              label="Email"
              value={school.email}
            />

            <InfoItem
              label="Website"
              value={school.website}
            />

            <InfoItem
              label="Facebook"
              value={school.facebook}
            />

          </div>
        </section>

      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words font-medium text-gray-900">
        {value || 'Not available'}
      </p>
    </div>
  );
}