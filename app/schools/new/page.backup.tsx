'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function NewSchoolPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    school_type: '',
    address: '',
    municipality: '',
    ward: '',
    district: '',
    province: '',
    phone: '',
    email: '',
    website: '',
    facebook: '',
    principal: '',
    established_year: '',
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.from('schools').insert({
      name: form.name,
      school_type: form.school_type || null,
      address: form.address || null,
      municipality: form.municipality || null,
      ward: form.ward ? Number(form.ward) : null,
      district: form.district || null,
      province: form.province || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      facebook: form.facebook || null,
      principal: form.principal || null,
      established_year: form.established_year
        ? Number(form.established_year)
        : null,
    });

    if (error) {
      setMessage(`❌ ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage('✅ School added successfully!');

    setTimeout(() => {
      router.push('/schools');
    }, 800);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Add School
          </h1>
          <p className="mt-2 text-gray-600">
            Add a new school to NEPSOM.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {/* Basic information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h2>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  School Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                  placeholder="e.g. Shree Kalika Secondary School"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  School Type
                </label>
                <select
                  name="school_type"
                  value={form.school_type}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="Basic">Basic</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Higher Secondary">Higher Secondary</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Established Year
                </label>
                <input
                  name="established_year"
                  type="number"
                  value={form.established_year}
                  onChange={handleChange}
                  placeholder="e.g. 2045"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Location
            </h2>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                  placeholder="e.g. Pokhara, Kaski"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Municipality
                </label>
                <input
                  name="municipality"
                  value={form.municipality}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                  placeholder="e.g. Pokhara Metropolitan City"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Ward
                </label>
                <input
                  name="ward"
                  type="number"
                  min="1"
                  value={form.ward}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                  placeholder="e.g. 8"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  District
                </label>
                <input
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                  placeholder="e.g. Kaski"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Province
                </label>
                <input
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                  placeholder="e.g. Gandaki"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Contact Information
            </h2>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                  placeholder="e.g. 061-123456"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                  placeholder="school@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  name="website"
                  type="url"
                  value={form.website}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Facebook
                </label>
                <input
                  name="facebook"
                  type="url"
                  value={form.facebook}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>
          </div>

          {/* Principal */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              School Administration
            </h2>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Principal
              </label>
              <input
                name="principal"
                value={form.principal}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                placeholder="Principal's name"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={() => router.push('/schools')}
              className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Adding...' : 'Add School'}
            </button>
          </div>

          {message && (
            <p className="text-center text-sm font-medium">
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
