'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PendingPage() {
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

      if (profile) {
        const { data: schoolData } = await supabase
          .from('schools')
          .select('*')
          .eq('id', profile.school_id)
          .single();
        setSchool(schoolData);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-5xl">
          ⏳
        </div>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">Pending Approval</h1>
        <p className="mt-4 text-gray-600 leading-relaxed">
          Thank you for registering <strong className="text-gray-900">{school?.name || 'your school'}</strong>!
        </p>
        <p className="mt-3 text-gray-600 leading-relaxed">
          Your school account is currently under review. Our team will verify your details and activate your account within <strong className="text-blue-600">24-48 hours</strong>.
        </p>

        <div className="mt-6 rounded-xl bg-blue-50 border border-blue-100 p-4 text-left">
          <p className="text-sm font-semibold text-blue-900 mb-2">What happens next?</p>
          <ul className="text-sm text-blue-800 space-y-1.5">
            <li>✅ Our team verifies your school details</li>
            <li>✅ You'll receive a confirmation call/email</li>
            <li>✅ Your dashboard and school website go live</li>
          </ul>
        </div>

        <div className="mt-6 rounded-xl bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">Need help?</p>
          <p className="mt-1 text-sm text-gray-600">
            Contact us at <a href="mailto:basantadigitalprod@gmail.com" className="text-blue-600 hover:underline">basantadigitalprod@gmail.com</a>
          </p>
          <p className="text-sm text-gray-600">
            Or call: <a href="tel:+9779806532844" className="text-blue-600 hover:underline">+977-9806532844</a>
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition"
          >
            🔄 Check Approval Status
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/auth/login';
            }}
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Log Out
          </button>
        </div>

        {school?.slug && (
          <p className="mt-6 text-xs text-gray-500">
            Your school URL: <span className="font-mono text-gray-700">/s/{school.slug}</span>
          </p>
        )}
      </div>
    </main>
  );
}