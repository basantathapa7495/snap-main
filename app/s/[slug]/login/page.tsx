'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SchoolLoginPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: schoolData } = await supabase.from('schools').select('*').eq('slug', slug).single();
      setSchool(schoolData);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-gray-50"><p>Loading...</p></main>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <Link href={`/s/${slug}`} className="mb-6 inline-block text-sm text-blue-600 hover:text-blue-800">
          ← Back to {school?.name || 'Website'}
        </Link>
        
        <div className="rounded-2xl bg-white p-8 shadow-xl border border-gray-100 text-center">
          {school?.logo_url ? (
            <img src={school.logo_url} alt="Logo" className="mx-auto h-20 w-20 rounded-full object-cover border-4 border-blue-100 shadow-md" />
          ) : (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl shadow-md">🏫</div>
          )}
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{school?.name || 'School Portal'}</h1>
          <p className="mt-1 text-sm text-gray-500">Select your login type to continue</p>

          <div className="mt-8 space-y-4">
            {/* Teacher Login */}
            <Link 
              href={`/auth/login?role=teacher&school=${slug}`} 
              className="flex items-center gap-4 rounded-xl border-2 border-blue-100 bg-blue-50 p-4 text-left transition hover:border-blue-500 hover:bg-blue-100"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-2xl text-white">👩‍🏫</div>
              <div>
                <p className="font-bold text-gray-900">Teacher Login</p>
                <p className="text-xs text-gray-600">Attendance, marks, and class management</p>
              </div>
              <span className="ml-auto text-gray-400">→</span>
            </Link>

            {/* Student Login */}
            <Link 
              href={`/auth/login?role=student&school=${slug}`} 
              className="flex items-center gap-4 rounded-xl border-2 border-green-100 bg-green-50 p-4 text-left transition hover:border-green-500 hover:bg-green-100"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-2xl text-white">👨‍🎓</div>
              <div>
                <p className="font-bold text-gray-900">Student Login</p>
                <p className="text-xs text-gray-600">Results, attendance, and study materials</p>
              </div>
              <span className="ml-auto text-gray-400">→</span>
            </Link>

            {/* Principal/Admin Login */}
            <Link 
              href="/auth/login?role=principal" 
              className="flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              🔐 Principal / Admin Login
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">Powered by SNAP 🇳🇵</p>
      </div>
    </main>
  );
}