'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, BookOpen, Check, Eye, Globe2, Loader2, Palette,
  Image as ImageIcon, RefreshCw, Save, Settings, ShieldCheck, Upload,
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

type SchoolForm = {
  name: string;
  slug: string;
  school_type: string;
  school_level: string;
  established_year: string;
  principal: string;
  motto: string;
  short_description: string;
  about_text: string;
  principal_message: string;
  mission: string;
  vision: string;
  theme_color: string;
  logo_url: string;
  banner_url: string;
  phone: string;
  email: string;
  address: string;
  office_hours: string;
  facebook: string;
  instagram: string;
  youtube: string;
  facilities: string;
  activities: string;
};

const emptyForm: SchoolForm = {
  name: '', slug: '', school_type: '', school_level: '', established_year: '',
  principal: '', motto: '', short_description: '', about_text: '',
  principal_message: '', mission: '', vision: '', theme_color: 'blue',
  logo_url: '', banner_url: '', phone: '', email: '', address: '',
  office_hours: '', facebook: '', instagram: '', youtube: '', facilities: '', activities: '',
};

const tabs = [
  { id: 'basic', label: 'Basic information', icon: Settings },
  { id: 'about', label: 'About and mission', icon: BookOpen },
  { id: 'branding', label: 'Branding and contact', icon: Palette },
] as const;

type TabId = (typeof tabs)[number]['id'];

const inputClass = 'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';
const labelClass = 'block text-sm font-semibold text-gray-700';

export default function WebsiteEditorPage() {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [form, setForm] = useState<SchoolForm>(emptyForm);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const previewHref = useMemo(() => form.slug ? `/s/${form.slug}` : '', [form.slug]);

  const update = (field: keyof SchoolForm, value: string) => {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const loadSchool = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Your session has expired. Please sign in again.');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('school_id, role')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.school_id) throw new Error('Your account is not connected to a school.');
      if (profile.role !== 'admin' && profile.role !== 'principal') {
        throw new Error('Only a school administrator can edit the public website.');
      }

      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('name, slug, school_type, school_level, established_year, principal, motto, short_description, about_text, principal_message, mission, vision, theme_color, logo_url, banner_url, phone, email, address, office_hours, facebook, instagram, youtube, facilities, activities')
        .eq('id', profile.school_id)
        .single();

      if (schoolError) throw schoolError;
      setSchoolId(profile.school_id);
      setForm({
        name: school.name ?? '', slug: school.slug ?? '', school_type: school.school_type ?? '',
        school_level: school.school_level ?? '', established_year: school.established_year?.toString() ?? '',
        principal: school.principal ?? '', motto: school.motto ?? '',
        short_description: school.short_description ?? '', about_text: school.about_text ?? '',
        principal_message: school.principal_message ?? '', mission: school.mission ?? '', vision: school.vision ?? '',
        theme_color: school.theme_color ?? 'blue', logo_url: school.logo_url ?? '', banner_url: school.banner_url ?? '',
        phone: school.phone ?? '', email: school.email ?? '', address: school.address ?? '',
        office_hours: school.office_hours ?? '', facebook: school.facebook ?? '', instagram: school.instagram ?? '',
        youtube: school.youtube ?? '', facilities: school.facilities ?? '', activities: school.activities ?? '',
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load your school website.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadSchool(); }, []);

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !schoolId) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Please choose a PNG, JPG or WebP logo.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('The logo must be smaller than 2 MB.');
      return;
    }

    setUploadingLogo(true);
    setSaved(false);
    setError('');
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `${schoolId}/logo/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('school-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('school-assets')
        .getPublicUrl(filePath);
      const logoUrl = publicUrlData.publicUrl;

      const { error: schoolError } = await supabase
        .from('schools')
        .update({ logo_url: logoUrl })
        .eq('id', schoolId);
      if (schoolError) throw schoolError;

      setForm((current) => ({ ...current, logo_url: logoUrl }));
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not upload the school logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveChanges = async () => {
    if (!schoolId) return;
    if (!form.name.trim() || !form.slug.trim()) {
      setError('School name and website slug are required.');
      return;
    }
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const payload = {
        ...form,
        slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''),
        established_year: form.established_year ? Number(form.established_year) : null,
      };
      const { data, error: updateError } = await supabase
        .from('schools')
        .update(payload)
        .eq('id', schoolId)
        .select('slug')
        .single();
      if (updateError) throw updateError;
      setForm((current) => ({ ...current, slug: data.slug }));
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save the website changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">Public website</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">Website editor</h1>
                <p className="mt-1.5 text-sm text-gray-500">Changes appear on your school’s public NEPSOM page.</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {previewHref ? (
                  <Link href={previewHref} target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
                    <Eye className="h-4 w-4" /> Preview website
                  </Link>
                ) : (
                  <button disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400"><Eye className="h-4 w-4" /> Preview website</button>
                )}
                <button onClick={saveChanges} disabled={loading || saving || !schoolId} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
                </button>
              </div>
            </div>

            {error && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1"><p className="font-semibold">Website editor needs attention</p><p className="mt-0.5">{error}</p></div><button onClick={loadSchool} className="inline-flex items-center gap-1 font-semibold"><RefreshCw className="h-4 w-4" /> Retry</button></div>}
            {saved && !error && <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><ShieldCheck className="h-5 w-5" /><span>Your website changes were saved successfully.</span></div>}

            {loading ? (
              <div className="flex min-h-80 items-center justify-center rounded-3xl border border-gray-200 bg-white"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /><span className="ml-3 text-sm font-medium text-gray-600">Loading your website…</span></div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-2 shadow-sm lg:sticky lg:top-28">
                  {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Icon className="h-4 w-4" />{tab.label}</button>; })}
                </aside>

                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
                  {activeTab === 'basic' && <div className="space-y-6"><SectionTitle title="Basic information" description="The main identity and introduction shown on your website." /><div className="grid gap-5 sm:grid-cols-2"><Field label="School name" value={form.name} onChange={(v) => update('name', v)} required /><Field label="Website slug" value={form.slug} onChange={(v) => update('slug', v)} prefix="nepsom.xyz/s/" required /><Field label="School type" value={form.school_type} onChange={(v) => update('school_type', v)} /><Field label="School level" value={form.school_level} onChange={(v) => update('school_level', v)} /><Field label="Established year (B.S.)" value={form.established_year} onChange={(v) => update('established_year', v)} type="number" /><Field label="Principal name" value={form.principal} onChange={(v) => update('principal', v)} /><Field label="School motto" value={form.motto} onChange={(v) => update('motto', v)} wide /><TextArea label="Short description" value={form.short_description} onChange={(v) => update('short_description', v)} rows={3} wide /></div></div>}
                  {activeTab === 'about' && <div className="space-y-6"><SectionTitle title="About and mission" description="Tell families what your school stands for." /><div className="grid gap-5"><TextArea label="About the school" value={form.about_text} onChange={(v) => update('about_text', v)} rows={6} /><TextArea label="Principal’s message" value={form.principal_message} onChange={(v) => update('principal_message', v)} rows={5} /><div className="grid gap-5 sm:grid-cols-2"><TextArea label="Mission" value={form.mission} onChange={(v) => update('mission', v)} rows={5} /><TextArea label="Vision" value={form.vision} onChange={(v) => update('vision', v)} rows={5} /></div><TextArea label="Facilities" value={form.facilities} onChange={(v) => update('facilities', v)} rows={3} /><TextArea label="Activities" value={form.activities} onChange={(v) => update('activities', v)} rows={3} /></div></div>}
                  {activeTab === 'branding' && <div className="space-y-6"><SectionTitle title="Branding and contact" description="Control the look of the site and how families contact you." /><div><label className={labelClass}>Theme colour</label><div className="mt-3 flex flex-wrap gap-3">{['blue','emerald','purple','red','amber','teal'].map((color) => <button key={color} type="button" onClick={() => update('theme_color', color)} aria-label={`Use ${color} theme`} className={`h-11 w-11 rounded-full border-4 shadow-sm transition ${form.theme_color === color ? 'scale-110 border-gray-900' : 'border-white ring-1 ring-gray-200'}`} style={{ backgroundColor: color === 'blue' ? '#2563eb' : color === 'emerald' ? '#059669' : color === 'purple' ? '#9333ea' : color === 'red' ? '#dc2626' : color === 'amber' ? '#d97706' : '#0d9488' }} />)}</div></div><div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-lg ring-1 ring-blue-100">
                        {form.logo_url ? (
                          <img src={form.logo_url} alt="School logo preview" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <ImageIcon className="h-9 w-9 text-blue-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-950">School logo</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">Upload a square logo for the best circular result. PNG, JPG or WebP, up to 2 MB.</p>
                        <label className={`mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${uploadingLogo ? 'cursor-wait bg-blue-400' : 'bg-blue-600 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md'}`}>
                          {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          {uploadingLogo ? 'Uploading…' : form.logo_url ? 'Replace logo' : 'Upload logo'}
                          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo} disabled={uploadingLogo || !schoolId} className="sr-only" />
                        </label>
                      </div>
                    </div>
                  </div><div className="grid gap-5 sm:grid-cols-2"><Field label="Logo image URL (optional)" value={form.logo_url} onChange={(v) => update('logo_url', v)} type="url" /><Field label="Banner image URL" value={form.banner_url} onChange={(v) => update('banner_url', v)} type="url" /><Field label="Phone" value={form.phone} onChange={(v) => update('phone', v)} /><Field label="Email" value={form.email} onChange={(v) => update('email', v)} type="email" /><Field label="Address" value={form.address} onChange={(v) => update('address', v)} wide /><Field label="Office hours" value={form.office_hours} onChange={(v) => update('office_hours', v)} wide /><Field label="Facebook URL" value={form.facebook} onChange={(v) => update('facebook', v)} type="url" /><Field label="Instagram URL" value={form.instagram} onChange={(v) => update('instagram', v)} type="url" /><Field label="YouTube URL" value={form.youtube} onChange={(v) => update('youtube', v)} type="url" /></div></div>}
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) { return <div className="border-b border-gray-100 pb-5"><h2 className="text-xl font-bold text-gray-950">{title}</h2><p className="mt-1 text-sm text-gray-500">{description}</p></div>; }
function Field({ label, value, onChange, type = 'text', wide = false, required = false, prefix }: { label: string; value: string; onChange: (value: string) => void; type?: string; wide?: boolean; required?: boolean; prefix?: string }) { return <label className={wide ? 'sm:col-span-2' : ''}><span className={labelClass}>{label}{required && <span className="text-red-500"> *</span>}</span>{prefix ? <div className="mt-1.5 flex overflow-hidden rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10"><span className="flex items-center bg-gray-50 px-3 text-xs text-gray-500">{prefix}</span><input className="min-w-0 flex-1 px-3.5 py-2.5 text-sm outline-none" value={value} onChange={(e) => onChange(e.target.value)} required={required} /></div> : <input className={inputClass} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />}</label>; }
function TextArea({ label, value, onChange, rows, wide = false }: { label: string; value: string; onChange: (value: string) => void; rows: number; wide?: boolean }) { return <label className={wide ? 'sm:col-span-2' : ''}><span className={labelClass}>{label}</span><textarea className={`${inputClass} resize-y`} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
