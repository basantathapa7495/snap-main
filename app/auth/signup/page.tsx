'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { nepalData, getDistricts, getLocalLevels, getWards } from '@/lib/nepal-data';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  School,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    } catch (err: unknown) {
      setError(
        'Something went wrong: ' +
          (err instanceof Error ? err.message : 'Please try again.')
      );
    }
    setLoading(false);
  }

  const inputClass =
    'h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="relative overflow-hidden bg-[#071a3a] px-6 py-6 text-white sm:px-8 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:px-10 lg:py-9">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -left-28 -top-32 h-80 w-80 rounded-full bg-blue-500/20 blur-[90px]" />
            <div className="absolute -bottom-36 -right-28 h-96 w-96 rounded-full bg-indigo-500/15 blur-[100px]" />
            <div
              className="absolute inset-0 opacity-[0.055]"
              style={{
                backgroundImage: 'radial-gradient(circle, #bfdbfe 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3" aria-label="SNAP home">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg shadow-black/10">
                <Image src="/logo1.png" alt="" width={34} height={34} className="object-contain" priority />
              </span>
              <span>
                <span className="block text-lg font-extrabold leading-none">SNAP</span>
                <span className="mt-1 block text-[10px] text-slate-400">School Nepal Administration Platform</span>
              </span>
            </Link>
            <Link href="/" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden" aria-label="Back to homepage">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>

          <div className="relative z-10 mt-10 lg:my-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              30 days free
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-4xl">
              Bring your school
              <span className="block text-blue-300">into one place.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
              Create your principal account, add your school information and get your SNAP workspace ready.
            </p>

            <div className="mt-7 hidden space-y-4 lg:block">
              {[
                'Full access to every SNAP feature',
                'No credit card or setup fee',
                'Works on phone and computer',
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" strokeWidth={2} />
                  </span>
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 mt-8 hidden text-xs text-slate-500 lg:block">
            Built for schools in Nepal
          </p>
        </aside>

        <section className="relative px-4 py-8 sm:px-8 lg:px-12 lg:py-12 xl:px-20">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">Create your SNAP workspace</p>
                <h2 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">
                  Register your school
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  Complete the three sections below. Your school will be reviewed before activation.
                </p>
              </div>
              <Link href="/" className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm lg:flex">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-2">
              {[
                { number: '1', label: 'Your account' },
                { number: '2', label: 'School details' },
                { number: '3', label: 'Location' },
              ].map((step) => (
                <div key={step.number} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 shadow-sm sm:px-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">{step.number}</span>
                  <span className="truncate text-[11px] font-semibold text-slate-600 sm:text-xs">{step.label}</span>
                </div>
              ))}
            </div>

            {error && (
              <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm leading-5 text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <fieldset disabled={loading} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <legend className="sr-only">Principal account</legend>
                <SectionHeading icon={UserRound} number="1" title="Principal account" description="These details will be used to create your administrator login." />
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" icon={UserRound}>
                    <input className={`${inputClass} pl-11`} type="text" name="full_name" autoComplete="name" required placeholder="e.g. Ram Bahadur" />
                  </Field>
                  <Field label="Phone number" icon={Phone}>
                    <input className={`${inputClass} pl-11`} type="tel" name="phone" inputMode="tel" autoComplete="tel" required placeholder="98XXXXXXXX" />
                  </Field>
                  <Field label="Login email" icon={Mail}>
                    <input className={`${inputClass} pl-11`} type="email" name="email" inputMode="email" autoComplete="email" required placeholder="principal@example.com" />
                  </Field>
                  <Field label="Password" icon={LockKeyhole}>
                    <input className={`${inputClass} pl-11 pr-12`} type={showPassword ? 'text' : 'password'} name="password" autoComplete="new-password" required minLength={6} placeholder="At least 6 characters" />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </Field>
                </div>
              </fieldset>

              <fieldset disabled={loading} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <legend className="sr-only">School details</legend>
                <SectionHeading icon={School} number="2" title="School details" description="Tell us the basic information about your school." />
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="School name" icon={School} wide>
                    <input className={`${inputClass} pl-11`} type="text" name="school_name" autoComplete="organization" required placeholder="e.g. Shree Kalika Secondary School" />
                  </Field>
                  <Field label="School type">
                    <select className={inputClass} name="school_type" required defaultValue="">
                      <option value="" disabled>Select school type</option>
                      <option value="Community">Community (Government)</option>
                      <option value="Private">Private (Institutional)</option>
                      <option value="Religious">Religious / Mission</option>
                    </select>
                  </Field>
                  <Field label="School level">
                    <select className={inputClass} name="school_level" required defaultValue="">
                      <option value="" disabled>Select school level</option>
                      <option value="Primary">Primary (1–5)</option>
                      <option value="Basic">Basic (1–8)</option>
                      <option value="Secondary">Secondary (1–10)</option>
                      <option value="Higher Secondary">Higher Secondary (11–12)</option>
                    </select>
                  </Field>
                  <Field label="School email" optional icon={Mail}>
                    <input className={`${inputClass} pl-11`} type="email" name="school_email" inputMode="email" autoComplete="email" placeholder="info@school.edu.np" />
                  </Field>
                  <Field label="PAN number" optional>
                    <input className={inputClass} type="text" name="pan_number" inputMode="numeric" placeholder="e.g. 123456789" />
                  </Field>
                </div>
              </fieldset>

              <fieldset disabled={loading} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <legend className="sr-only">School location</legend>
                <SectionHeading icon={MapPin} number="3" title="School location" description="Choose each level to find the correct ward for your school." />
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Province">
                    <select className={inputClass} value={selectedProvince || ''} required onChange={(event) => { setSelectedProvince(Number(event.target.value) || null); setSelectedDistrict(''); setSelectedLocalLevel(''); setSelectedWard(''); }}>
                      <option value="" disabled>Select province</option>
                      {nepalData.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}
                    </select>
                  </Field>
                  <Field label="District">
                    <select className={inputClass} value={selectedDistrict} required disabled={!selectedProvince} onChange={(event) => { setSelectedDistrict(event.target.value); setSelectedLocalLevel(''); setSelectedWard(''); }}>
                      <option value="" disabled>Select district</option>
                      {districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Local level">
                    <select className={inputClass} value={selectedLocalLevel} required disabled={!selectedDistrict} onChange={(event) => { setSelectedLocalLevel(event.target.value); setSelectedWard(''); }}>
                      <option value="" disabled>Select local level</option>
                      {localLevels.map((localLevel) => <option key={localLevel.id} value={localLevel.id}>{localLevel.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Ward number">
                    <select className={inputClass} value={selectedWard} required disabled={!selectedLocalLevel || wards.length === 0} onChange={(event) => setSelectedWard(event.target.value)}>
                      <option value="" disabled>Select ward</option>
                      {wards.map((ward) => <option key={ward} value={ward}>Ward {ward}</option>)}
                    </select>
                  </Field>
                </div>
                {selectedProvince && selectedDistrict && selectedLocalLevel && selectedWard && (
                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Complete school location selected
                  </div>
                )}
              </fieldset>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
                <div className="flex items-start gap-3">
                  <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Your school workspace is included</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">We will prepare your dashboard and school website after review.</p>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="group mt-4 flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0 sm:w-auto">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating school…</>
                  ) : (
                    <>Register school <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              Already registered?{' '}
              <Link href="/auth/login" className="font-semibold text-blue-700 hover:text-blue-900">Sign in to SNAP</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({
  icon: Icon,
  number,
  title,
  description,
}: {
  icon: React.ElementType;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white">{number}</span>
      </span>
      <div>
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  optional = false,
  icon: Icon,
  wide = false,
  children,
}: {
  label: string;
  optional?: boolean;
  icon?: React.ElementType;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? 'sm:col-span-2' : undefined}>
      <span className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-700">
        {label}
        {optional ? <span className="font-normal text-slate-400">(optional)</span> : <span className="text-blue-600">*</span>}
      </span>
      <span className="relative block">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" strokeWidth={1.8} />}
        {children}
      </span>
    </label>
  );
}
