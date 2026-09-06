'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EditSchoolPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadSchool() {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setMessage(`❌ ${error.message}`);
        setLoading(false);
        return;
      }

      setForm({
        name: data.name || '',
        school_type: data.school_type || '',
        address: data.address || '',
        municipality: data.municipality || '',
        ward: data.ward?.toString() || '',
        district: data.district || '',
        province: data.province || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        facebook: data.facebook || '',
        principal: data.principal || '',
        established_year: data.established_year?.toString() || '',
      });

      setLoading(false);
    }

    loadSchool();
  }, [id]);

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

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('schools')
      .update({
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
      })
      .eq('id', id);

    if (error) {
      setMessage(`❌ ${error.message}`);
      setSaving(false);
      return;
    }

    setMessage('✅ School updated successfully!');

    setSaving(false);

    setTimeout(() => {
      router.push('/schools');
    }, 800);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-gray-600">Loading school...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit School
          </h1>

          <p className="mt-2 text-gray-600">
            Update the school's information.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >

          {/* Basic Information */}

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
                  <option value="Higher Secondary">
                    Higher Secondary
                  </option>
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
                />
              </div>

            </div>
          </div>

          {/* Administration */}

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
              />
            </div>
          </div>

          {/* Buttons */}

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
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
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