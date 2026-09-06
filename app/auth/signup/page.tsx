'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { nepalData, getDistricts, getLocalLevels, getWards } from '@/lib/nepal-data';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedLocalLevel, setSelectedLocalLevel] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  const districts = selectedProvince ? getDistricts(selectedProvince) : [];
  const localLevels = selectedProvince && selectedDistrict ? getLocalLevels(selectedProvince, selectedDistrict) : [];
  const wards = selectedProvince && selectedDistrict && selectedLocalLevel ? getWards(selectedProvince, selectedDistrict, selectedLocalLevel) : [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!selectedProvince || !selectedDistrict || !selectedLocalLevel || !selectedWard) {
      setError('Please select your complete location (Province to Ward).');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const schoolName = formData.get('school_name') as string;
    const schoolEmail = formData.get('school_email') as string;
    const panNumber = formData.get('pan_number') as string;

    const provinceName = nepalData.find((p) => p.id === selectedProvince)?.name || '';
    const districtName = districts.find((d) => d.id === selectedDistrict)?.name || '';
    const localLevelName = localLevels.find((l) => l.id === selectedLocalLevel)?.name || '';

    // Auto-generate the school website link (slug)
    const slug = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (authError) { setError(authError.message); setLoading(false); return; }
      const userId = authData.user?.id;
      if (!userId) { setError('No user created'); setLoading(false); return; }

      // 2. Create School Record (Without registration number & motto)
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .insert({
          name: schoolName,
          slug,
          province: provinceName,
          district: districtName,
          municipality: localLevelName,
          ward: selectedWard,
          school_type: formData.get('school_type'),
          school_level: formData.get('school_level'),
          phone: formData.get('phone'),
          principal: fullName,
          school_email: schoolEmail || null,
          pan_number: panNumber || null,
        })
        .select()
        .single();
      if (schoolError) { setError('Could not create school: ' + schoolError.message); setLoading(false); return; }

      // 3. Create Profile Link
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ user_id: userId, school_id: schoolData.id, role: 'admin', full_name: fullName });
      if (profileError) { setError('Could not create profile: ' + profileError.message); setLoading(false); return; }

      // 4. Auto-generate classes based on school level
      const schoolLevel = formData.get('school_level') as string;
      let classNumbers: number[] = [];
      if (schoolLevel === 'Primary') classNumbers = [1, 2, 3, 4, 5];
      else if (schoolLevel === 'Basic') classNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
      else if (schoolLevel === 'Secondary') classNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      else if (schoolLevel === 'Higher Secondary') classNumbers = [11, 12];

      const classRows = classNumbers.map((n) => ({
        school_id: schoolData.id,
        class_number: n.toString(),
        section_name: null,
        class_name: `Class ${n}`,
        name: `Class ${n}`,
      }));

      if (classRows.length > 0) {
        await supabase.from('classes').insert(classRows);
      }

      router.push('/pending');
    } catch (err: any) {
      setError('Something went wrong: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <img src="/logo1.png" alt="SNAP logo" className="h-12 w-auto" />
            <img src="/logo2.png" alt="SNAP" className="h-7 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Register Your School</h1>
          <p className="mt-2 text-gray-600">Get your own website and dashboard instantly.</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Principal's Account */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm">1</span>
                Principal's Account
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                  <input type="text" name="full_name" required placeholder="e.g. Ram Bahadur"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number *</label>
                  <input type="tel" name="phone" required placeholder="e.g. 98XXXXXXXX"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email Address (for login) *</label>
                  <input type="email" name="email" required placeholder="principal@example.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Password *</label>
                  <input type="password" name="password" required minLength={6} placeholder="At least 6 characters"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            {/* Section 2: School Details */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm">2</span>
                School Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">School Name *</label>
                  <input type="text" name="school_name" required placeholder="e.g. Shree Kalika Secondary School"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">School Type *</label>
                    <select name="school_type" required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option value="">Select type</option>
                      <option value="Community">Community (Government)</option>
                      <option value="Private">Private (Institutional)</option>
                      <option value="Religious">Religious / Mission</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">School Level *</label>
                    <select name="school_level" required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option value="">Select level</option>
                      <option value="Primary">Primary (1–5)</option>
                      <option value="Basic">Basic (1–8)</option>
                      <option value="Secondary">Secondary (1–10)</option>
                      <option value="Higher Secondary">Higher Secondary (11–12)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">School Email (Optional)</label>
                    <input type="email" name="school_email" placeholder="info@school.edu.np"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">PAN Number (Optional)</label>
                    <input type="text" name="pan_number" placeholder="e.g. 123456789"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Location */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm">3</span>
                School Location
              </h2>
              <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Province *</label>
                    <select value={selectedProvince || ''} required
                      onChange={(e) => { setSelectedProvince(Number(e.target.value) || null); setSelectedDistrict(''); setSelectedLocalLevel(''); setSelectedWard(''); }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option value="">Select Province</option>
                      {nepalData.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">District *</label>
                    <select value={selectedDistrict} required disabled={!selectedProvince}
                      onChange={(e) => { setSelectedDistrict(e.target.value); setSelectedLocalLevel(''); setSelectedWard(''); }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400">
                      <option value="">Select District</option>
                      {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Local Level *</label>
                    <select value={selectedLocalLevel} required disabled={!selectedDistrict}
                      onChange={(e) => { setSelectedLocalLevel(e.target.value); setSelectedWard(''); }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400">
                      <option value="">Select Local Level</option>
                      {localLevels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Ward Number *</label>
                    <select value={selectedWard} required disabled={!selectedLocalLevel || wards.length === 0}
                      onChange={(e) => setSelectedWard(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400">
                      <option value="">Select Ward</option>
                      {wards.map((w) => <option key={w} value={w}>Ward {w}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-100">
              <button type="submit" disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-3.5 font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {loading ? 'Creating your school & website...' : '🚀 Create My School + Website'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-700">Log in</a>
          </p>
        </div>
      </div>
    </main>
  );
}