'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdmissionPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [admissionForm, setAdmissionForm] = useState<any>({ student_name: '', class: '', gender: '', dob: '', parent_name: '', parent_phone: '', parent_email: '', address: '', previous_school: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: schoolData } = await supabase.from('schools').select('*').eq('slug', slug).single();
      setSchool(schoolData || null);
      setLoading(false);
    }
    load();
  }, [slug]);

  const admissionClasses: string[] = (() => {
    const level = school?.school_level;
    if (level === 'Primary') return ['1', '2', '3', '4', '5'];
    if (level === 'Basic') return ['1', '2', '3', '4', '5', '6', '7', '8'];
    if (level === 'Secondary') return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    if (level === 'Higher Secondary') return ['11', '12'];
    return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  })();

  async function submitAdmission(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error: dbError } = await supabase.from('admission_applications').insert({
      school_id: school.id,
      student_name: admissionForm.student_name,
      class: admissionForm.class,
      gender: admissionForm.gender || null,
      dob: admissionForm.dob || null,
      parent_name: admissionForm.parent_name,
      parent_phone: admissionForm.parent_phone,
      parent_email: admissionForm.parent_email || null,
      address: admissionForm.address || null,
      previous_school: admissionForm.previous_school || null,
      message: admissionForm.message || null,
      status: 'pending',
    });
    if (dbError) {
      setError('Could not submit: ' + dbError.message);
    } else {
      setSuccess(true);
      setAdmissionForm({ student_name: '', class: '', gender: '', dob: '', parent_name: '', parent_phone: '', parent_email: '', address: '', previous_school: '', message: '' });
    }
    setSubmitting(false);
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-gray-50"><p className="text-gray-500">Loading...</p></main>;

  if (!school) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-5xl">🏫</p>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">School not found</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ===== Header with school branding ===== */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 py-8 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Link href={`/s/${slug}`} className="text-sm text-blue-100 hover:text-white">← Back to Website</Link>
          {school.logo_url && <img src={school.logo_url} alt="Logo" className="mx-auto mt-3 h-16 w-16 rounded-full border-2 border-white object-cover" />}
          <h1 className="mt-3 text-2xl font-bold">📋 Admission Application</h1>
          <p className="mt-1 text-blue-100">{school.name} · {school.municipality}, {school.district}</p>
        </div>
      </div>

      {/* ===== Form or Success ===== */}
      <div className="mx-auto max-w-3xl px-4 py-10">
        {success ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <p className="text-5xl">🎉</p>
            <h2 className="mt-4 text-2xl font-bold text-green-800">Application Submitted!</h2>
            <p className="mt-2 text-sm text-green-700">
              Thank you! <span className="font-semibold">{school.name}</span> will contact you soon on the phone number you provided.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => setSuccess(false)} className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
                Submit Another Application
              </button>
              <Link href={`/s/${slug}`} className="rounded-lg border border-green-600 px-5 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100">
                ← Back to School Website
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submitAdmission} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              ℹ️ Fill this form carefully. The school office will verify the details and contact you.
            </div>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Student Full Name *</label>
                <input required value={admissionForm.student_name} onChange={(e) => setAdmissionForm({ ...admissionForm, student_name: e.target.value })} placeholder="e.g. Sita Thapa" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Applying for Class *</label>
                <select required value={admissionForm.class} onChange={(e) => setAdmissionForm({ ...admissionForm, class: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500">
                  <option value="">Select class</option>
                  {admissionClasses.map((c: string) => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Gender</label>
                <select value={admissionForm.gender} onChange={(e) => setAdmissionForm({ ...admissionForm, gender: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" value={admissionForm.dob} onChange={(e) => setAdmissionForm({ ...admissionForm, dob: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Parent/Guardian Name *</label>
                <input required value={admissionForm.parent_name} onChange={(e) => setAdmissionForm({ ...admissionForm, parent_name: e.target.value })} placeholder="e.g. Ram Bahadur Thapa" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Parent Phone *</label>
                <input required type="tel" value={admissionForm.parent_phone} onChange={(e) => setAdmissionForm({ ...admissionForm, parent_phone: e.target.value })} placeholder="98XXXXXXXX" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email (optional)</label>
                <input type="email" value={admissionForm.parent_email} onChange={(e) => setAdmissionForm({ ...admissionForm, parent_email: e.target.value })} placeholder="parent@email.com" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                <input value={admissionForm.address} onChange={(e) => setAdmissionForm({ ...admissionForm, address: e.target.value })} placeholder="Ward, Municipality" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Previous School (optional)</label>
              <input value={admissionForm.previous_school} onChange={(e) => setAdmissionForm({ ...admissionForm, previous_school: e.target.value })} placeholder="Name of previous school" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Message (optional)</label>
              <textarea rows={3} value={admissionForm.message} onChange={(e) => setAdmissionForm({ ...admissionForm, message: e.target.value })} placeholder="Anything the school should know..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500" />
            </div>
            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Submitting...' : '📋 Submit Application'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}