'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AddStudentPage() {
  const router = useRouter();
  const [school, setSchool] = useState<any>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth/login';
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('user_id', user.id)
        .single();
      if (!profile) {
        setLoading(false);
        return;
      }
      setSchoolId(profile.school_id);

      // Get school level
      const { data: schoolData } = await supabase
        .from('schools')
        .select('school_level')
        .eq('id', profile.school_id)
        .single();
      setSchool(schoolData);

      // Generate classes based on school level
      const level = schoolData?.school_level;
      let classList: string[] = [];
      if (level === 'Primary') {
        classList = ['1', '2', '3', '4', '5'];
      } else if (level === 'Basic') {
        classList = ['1', '2', '3', '4', '5', '6', '7', '8'];
      } else if (level === 'Secondary') {
        classList = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
      } else if (level === 'Higher Secondary') {
        classList = ['11', '12'];
      } else {
        // Default fallback if level not set
        classList = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
      }
      setClasses(classList);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    if (!schoolId) {
      setError('School not found.');
      setSaving(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const studentData = {
      school_id: schoolId,
      name: formData.get('name') as string,
      class: formData.get('class') as string,
      section: formData.get('section') as string,
      roll_no: formData.get('roll_no') as string,
      parent_name: formData.get('parent_name') as string,
      parent_phone: formData.get('parent_phone') as string,
    };

    const { error: dbError } = await supabase.from('students').insert(studentData);
    if (dbError) {
      setError('Error: ' + dbError.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/students'), 1500);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">➕ Add Student</h1>
          <Link href="/students" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            ← Back to Students
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            ✅ Student added! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Student Name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Sita Thapa"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Class *</label>
              <select
                name="class"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
              {school?.school_level && (
                <p className="mt-1 text-xs text-gray-400">{school.school_level}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Section</label>
              <select
                name="section"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="">Select Section</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Roll No</label>
              <input
                type="text"
                name="roll_no"
                placeholder="e.g. 5"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Parent Name</label>
              <input
                type="text"
                name="parent_name"
                placeholder="e.g. Ram Bahadur Thapa"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Parent Phone</label>
              <input
                type="tel"
                name="parent_phone"
                placeholder="e.g. 98XXXXXXXX"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Student'}
          </button>
        </form>
      </div>
    </main>
  );
}