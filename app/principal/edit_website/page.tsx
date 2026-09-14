'use client';

import { ChangeEvent, ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, BookOpen, Building2, Check, Eye, Globe2, Image as ImageIcon,
  Loader2, Palette, Plus, Save, Settings, Trash2, Upload,
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

type Program = { title: string; desc: string };
type Reason = { icon?: string; title: string; desc: string };

type WebsiteForm = {
  name: string;
  slug: string;
  school_type: string;
  school_level: string;
  established_year: string;
  principal: string;
  motto: string;
  short_description: string;
  principal_message: string;
  about_text: string;
  mission: string;
  vision: string;
  logo_url: string;
  banner_url: string;
  theme_color: string;
  address: string;
  phone: string;
  email: string;
  phones_text: string;
  emails_text: string;
  office_hours: string;
  website: string;
  facebook: string;
  instagram: string;
  youtube: string;
  map_location: string;
  facilities: string;
  activities: string;
  rules_policies: string;
  programs: Program[];
  why_choose_us: Reason[];
  admission_cta_items: string[];
  show_programs: boolean;
  show_news: boolean;
  show_notices: boolean;
  show_testimonials: boolean;
  show_awards: boolean;
  show_achievements: boolean;
};

const emptyForm: WebsiteForm = {
  name: '', slug: '', school_type: '', school_level: '', established_year: '',
  principal: '', motto: '', short_description: '', principal_message: '',
  about_text: '', mission: '', vision: '', logo_url: '', banner_url: '',
  theme_color: 'blue', address: '', phone: '', email: '', phones_text: '',
  emails_text: '', office_hours: '', website: '', facebook: '', instagram: '',
  youtube: '', map_location: '', facilities: '', activities: '', rules_policies: '',
  programs: [], why_choose_us: [], admission_cta_items: [],
  show_programs: true, show_news: true, show_notices: true,
  show_testimonials: true, show_awards: true, show_achievements: true,
};

const tabs = [
  { id: 'basic', label: 'Basic information', icon: Settings },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'about', label: 'About & mission', icon: BookOpen },
  { id: 'programs', label: 'Programs', icon: BookOpen },
  { id: 'campus', label: 'Campus', icon: Building2 },
  { id: 'contact', label: 'Contact', icon: Globe2 },
  { id: 'visibility', label: 'Visibility', icon: Eye },
];

const colors = [
  { id: 'blue', value: '#2563eb' },
  { id: 'emerald', value: '#059669' },
  { id: 'purple', value: '#7c3aed' },
  { id: 'red', value: '#dc2626' },
  { id: 'amber', value: '#d97706' },
  { id: 'teal', value: '#0d9488' },
];

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div className="mb-6 border-b border-gray-100 pb-4 dark:border-slate-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{title}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-200">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 4, placeholder = '' }: {
  label: string; value: string; onChange: (value: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-200">{label}</span>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </label>
  );
}

const stringValue = (value: unknown) => typeof value === 'string' ? value : '';
const stringArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const programsArray = (value: unknown): Program[] => Array.isArray(value)
  ? value.map((item) => ({
      title: stringValue((item as Record<string, unknown>)?.title),
      desc: stringValue((item as Record<string, unknown>)?.desc || (item as Record<string, unknown>)?.description),
    })).filter((item) => item.title || item.desc)
  : [];
const reasonsArray = (value: unknown): Reason[] => Array.isArray(value)
  ? value.map((item) => ({
      icon: stringValue((item as Record<string, unknown>)?.icon),
      title: stringValue((item as Record<string, unknown>)?.title),
      desc: stringValue((item as Record<string, unknown>)?.desc || (item as Record<string, unknown>)?.description),
    })).filter((item) => item.title || item.desc)
  : [];

export default function WebsiteEditorPage() {
  const [activeTab, setActiveTab] = useState('basic');
  const [schoolId, setSchoolId] = useState('');
  const [form, setForm] = useState<WebsiteForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo_url' | 'banner_url' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadWebsite = async () => {
      setLoading(true);
      setMessage(null);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setMessage({ type: 'error', text: 'Please sign in again to edit your school website.' });
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profile?.school_id) {
        setMessage({ type: 'error', text: 'No school is linked to this account.' });
        setLoading(false);
        return;
      }

      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', profile.school_id)
        .single();

      if (schoolError || !school) {
        setMessage({ type: 'error', text: schoolError?.message || 'School details could not be loaded.' });
        setLoading(false);
        return;
      }

      setSchoolId(profile.school_id);
      setForm({
        ...emptyForm,
        name: stringValue(school.name),
        slug: stringValue(school.slug),
        school_type: stringValue(school.school_type),
        school_level: stringValue(school.school_level),
        established_year: school.established_year ? String(school.established_year) : '',
        principal: stringValue(school.principal),
        motto: stringValue(school.motto),
        short_description: stringValue(school.short_description),
        principal_message: stringValue(school.principal_message),
        about_text: stringValue(school.about_text),
        mission: stringValue(school.mission),
        vision: stringValue(school.vision),
        logo_url: stringValue(school.logo_url),
        banner_url: stringValue(school.banner_url),
        theme_color: stringValue(school.theme_color) || 'blue',
        address: stringValue(school.address),
        phone: stringValue(school.phone),
        email: stringValue(school.email || school.school_email),
        phones_text: stringArray(school.phones).join('\n'),
        emails_text: stringArray(school.emails).join('\n'),
        office_hours: stringValue(school.office_hours),
        website: stringValue(school.website),
        facebook: stringValue(school.facebook),
        instagram: stringValue(school.instagram),
        youtube: stringValue(school.youtube),
        map_location: stringValue(school.map_location),
        facilities: stringValue(school.facilities),
        activities: stringValue(school.activities),
        rules_policies: stringValue(school.rules_policies),
        programs: programsArray(school.programs),
        why_choose_us: reasonsArray(school.why_choose_us),
        admission_cta_items: stringArray(school.admission_cta_items),
        show_programs: school.show_programs !== false,
        show_news: school.show_news !== false,
        show_notices: school.show_notices !== false,
        show_testimonials: school.show_testimonials !== false,
        show_awards: school.show_awards !== false,
        show_achievements: school.show_achievements !== false,
      });
      setLoading(false);
    };

    void loadWebsite();
  }, []);

  const setField = <K extends keyof WebsiteForm>(key: K, value: WebsiteForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
  };

  const saveWebsite = async () => {
    if (!schoolId) return;
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'School name is required.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    const toLines = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean);
    const year = form.established_year.trim() ? Number(form.established_year) : null;

    const { error } = await supabase
      .from('schools')
      .update({
        name: form.name.trim(),
        school_type: form.school_type || null,
        school_level: form.school_level || null,
        established_year: Number.isFinite(year) ? year : null,
        principal: form.principal || null,
        motto: form.motto || null,
        short_description: form.short_description || null,
        principal_message: form.principal_message || null,
        about_text: form.about_text || null,
        mission: form.mission || null,
        vision: form.vision || null,
        logo_url: form.logo_url || null,
        banner_url: form.banner_url || null,
        theme_color: form.theme_color,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
        school_email: form.email || null,
        phones: toLines(form.phones_text),
        emails: toLines(form.emails_text),
        office_hours: form.office_hours || null,
        website: form.website || null,
        facebook: form.facebook || null,
        instagram: form.instagram || null,
        youtube: form.youtube || null,
        map_location: form.map_location || null,
        facilities: form.facilities || null,
        activities: form.activities || null,
        rules_policies: form.rules_policies || null,
        programs: form.programs,
        why_choose_us: form.why_choose_us,
        admission_cta_items: form.admission_cta_items.filter(Boolean),
        show_programs: form.show_programs,
        show_news: form.show_news,
        show_notices: form.show_notices,
        show_testimonials: form.show_testimonials,
        show_awards: form.show_awards,
        show_achievements: form.show_achievements,
      })
      .eq('id', schoolId);

    setSaving(false);
    setMessage(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'Website saved. The public school page now uses these details.' });
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'banner_url') => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !schoolId) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please choose an image file.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be smaller than 5 MB.' });
      return;
    }

    setUploading(field);
    setMessage(null);
    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const kind = field === 'logo_url' ? 'logo' : 'banner';
    const path = schoolId + '/' + kind + '-' + Date.now() + '.' + extension;
    const { error: uploadError } = await supabase.storage.from('school-assets').upload(path, file, {
      contentType: file.type,
      cacheControl: '3600',
    });

    if (uploadError) {
      setMessage({ type: 'error', text: uploadError.message });
      setUploading(null);
      return;
    }

    const { data } = supabase.storage.from('school-assets').getPublicUrl(path);
    setField(field, data.publicUrl);
    setUploading(null);
    setMessage({ type: 'success', text: 'Image uploaded. Click Save changes to publish it.' });
  };

  const updateProgram = (index: number, key: keyof Program, value: string) => {
    setField('programs', form.programs.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  };

  const updateReason = (index: number, key: keyof Reason, value: string) => {
    setField('why_choose_us', form.why_choose_us.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex min-h-screen items-center justify-center lg:ml-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 p-4 pb-24 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">Website editor</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Everything saved here is shown on your public school website.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {form.slug && (
                <Link href={'/s/' + form.slug} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-200 shadow-sm hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                  <Eye className="h-4 w-4" /> Preview
                </Link>
              )}
              <button onClick={saveWebsite} disabled={saving || !schoolId} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>

          {message && (
            <div className={'mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ' + (message.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800')}>
              {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <aside className="lg:col-span-1">
              <nav className="sticky top-28 space-y-1 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium ' + (activeTab === tab.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800')}>
                      <Icon className="h-4 w-4" /> {tab.label}
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="space-y-6 lg:col-span-3">
              {activeTab === 'basic' && (
                <Card title="Basic information" description="The identity and headline content shown at the top of your website.">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2"><Field label="School name" value={form.name} onChange={(value) => setField('name', value)} /></div>
                    <Field label="School type" value={form.school_type} onChange={(value) => setField('school_type', value)} placeholder="Community, private, boarding..." />
                    <Field label="School level" value={form.school_level} onChange={(value) => setField('school_level', value)} placeholder="Basic, secondary, higher secondary..." />
                    <Field label="Established year (B.S.)" value={form.established_year} onChange={(value) => setField('established_year', value.replace(/\D/g, ''))} />
                    <Field label="Principal name" value={form.principal} onChange={(value) => setField('principal', value)} />
                    <div className="md:col-span-2"><Field label="School motto" value={form.motto} onChange={(value) => setField('motto', value)} /></div>
                    <div className="md:col-span-2"><TextArea label="Short homepage description" value={form.short_description} onChange={(value) => setField('short_description', value)} rows={3} /></div>
                    <div className="md:col-span-2"><TextArea label="Principal's message" value={form.principal_message} onChange={(value) => setField('principal_message', value)} rows={5} /></div>
                  </div>
                </Card>
              )}

              {activeTab === 'branding' && (
                <Card title="Branding" description="Upload your logo and banner, then choose a primary website color.">
                  <div className="grid gap-6 md:grid-cols-2">
                    {(['logo_url', 'banner_url'] as const).map((field) => (
                      <div key={field}>
                        <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-200">{field === 'logo_url' ? 'School logo' : 'Hero banner'}</p>
                        <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center hover:border-blue-500 dark:border-slate-700 dark:bg-slate-950">
                          {form[field] ? <img src={form[field]} alt="" className="h-48 w-full object-cover" /> : (
                            <>
                              {uploading === field ? <Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-600" /> : field === 'logo_url' ? <Upload className="mb-2 h-8 w-8 text-gray-400" /> : <ImageIcon className="mb-2 h-8 w-8 text-gray-400" />}
                              <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Choose image</span>
                              <span className="mt-1 text-xs text-gray-500 dark:text-slate-400">PNG, JPG or WebP, maximum 5 MB</span>
                            </>
                          )}
                          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => uploadImage(event, field)} disabled={uploading !== null} />
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8">
                    <p className="mb-3 text-sm font-medium text-gray-700">Primary color</p>
                    <div className="flex flex-wrap gap-3">
                      {colors.map((color) => (
                        <button key={color.id} type="button" aria-label={color.id} onClick={() => setField('theme_color', color.id)} className={'h-12 w-12 rounded-xl border-4 transition-transform hover:scale-105 ' + (form.theme_color === color.id ? 'border-gray-900 dark:border-slate-100' : 'border-white ring-1 ring-gray-200 dark:border-slate-900 dark:ring-slate-700')} style={{ backgroundColor: color.value }} />
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === 'about' && (
                <Card title="About, mission & vision" description="Tell families what your school stands for.">
                  <div className="space-y-5">
                    <TextArea label="About the school" value={form.about_text} onChange={(value) => setField('about_text', value)} rows={6} />
                    <TextArea label="Mission" value={form.mission} onChange={(value) => setField('mission', value)} />
                    <TextArea label="Vision" value={form.vision} onChange={(value) => setField('vision', value)} />
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">Why choose us</p>
                        <button type="button" onClick={() => setField('why_choose_us', [...form.why_choose_us, { icon: '✓', title: '', desc: '' }])} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600"><Plus className="h-4 w-4" /> Add reason</button>
                      </div>
                      <div className="space-y-3">
                        {form.why_choose_us.map((item, index) => (
                          <div key={index} className="grid gap-3 rounded-xl border border-gray-200 p-4 dark:border-slate-700 dark:bg-slate-950/40 dark:border-slate-700 dark:bg-slate-950/40 md:grid-cols-[80px_1fr_2fr_auto]">
                            <Field label="Icon" value={item.icon || ''} onChange={(value) => updateReason(index, 'icon', value)} />
                            <Field label="Title" value={item.title} onChange={(value) => updateReason(index, 'title', value)} />
                            <Field label="Description" value={item.desc} onChange={(value) => updateReason(index, 'desc', value)} />
                            <button type="button" aria-label="Remove reason" onClick={() => setField('why_choose_us', form.why_choose_us.filter((_, itemIndex) => itemIndex !== index))} className="self-end rounded-lg p-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === 'programs' && (
                <Card title="Academic programs" description="Add the programs displayed on your public website.">
                  <div className="space-y-4">
                    {form.programs.map((program, index) => (
                      <div key={index} className="grid gap-3 rounded-xl border border-gray-200 p-4 dark:border-slate-700 dark:bg-slate-950/40 dark:border-slate-700 dark:bg-slate-950/40 md:grid-cols-[1fr_2fr_auto]">
                        <Field label="Program title" value={program.title} onChange={(value) => updateProgram(index, 'title', value)} />
                        <Field label="Description" value={program.desc} onChange={(value) => updateProgram(index, 'desc', value)} />
                        <button type="button" aria-label="Remove program" onClick={() => setField('programs', form.programs.filter((_, itemIndex) => itemIndex !== index))} className="self-end rounded-lg p-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setField('programs', [...form.programs, { title: '', desc: '' }])} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40"><Plus className="h-4 w-4" /> Add program</button>
                  </div>
                </Card>
              )}

              {activeTab === 'campus' && (
                <Card title="Campus information" description="Describe facilities, activities and school policies.">
                  <div className="space-y-5">
                    <TextArea label="Facilities" value={form.facilities} onChange={(value) => setField('facilities', value)} rows={5} />
                    <TextArea label="Activities" value={form.activities} onChange={(value) => setField('activities', value)} rows={5} />
                    <TextArea label="Rules and policies" value={form.rules_policies} onChange={(value) => setField('rules_policies', value)} rows={5} />
                  </div>
                </Card>
              )}

              {activeTab === 'contact' && (
                <Card title="Contact & social links" description="Keep each phone number or email address on a separate line.">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Main phone" value={form.phone} onChange={(value) => setField('phone', value)} />
                    <Field label="Main email" value={form.email} onChange={(value) => setField('email', value)} type="email" />
                    <div className="md:col-span-2"><TextArea label="Additional phone numbers" value={form.phones_text} onChange={(value) => setField('phones_text', value)} rows={3} /></div>
                    <div className="md:col-span-2"><TextArea label="Additional email addresses" value={form.emails_text} onChange={(value) => setField('emails_text', value)} rows={3} /></div>
                    <div className="md:col-span-2"><TextArea label="Address" value={form.address} onChange={(value) => setField('address', value)} rows={3} /></div>
                    <Field label="Office hours" value={form.office_hours} onChange={(value) => setField('office_hours', value)} />
                    <Field label="Website URL" value={form.website} onChange={(value) => setField('website', value)} />
                    <Field label="Facebook URL" value={form.facebook} onChange={(value) => setField('facebook', value)} />
                    <Field label="Instagram URL" value={form.instagram} onChange={(value) => setField('instagram', value)} />
                    <Field label="YouTube URL" value={form.youtube} onChange={(value) => setField('youtube', value)} />
                    <div className="md:col-span-2"><Field label="Google Maps link" value={form.map_location} onChange={(value) => setField('map_location', value)} /></div>
                  </div>
                </Card>
              )}

              {activeTab === 'visibility' && (
                <Card title="Website sections" description="Choose which sections visitors can see.">
                  <div className="space-y-3">
                    {([
                      ['show_programs', 'Academic programs'],
                      ['show_news', 'News and events'],
                      ['show_notices', 'Notices'],
                      ['show_testimonials', 'Testimonials'],
                      ['show_awards', 'Awards'],
                      ['show_achievements', 'Achievements'],
                    ] as Array<[keyof WebsiteForm, string]>).map(([key, label]) => (
                      <label key={key} className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-slate-700 dark:bg-slate-950/40 dark:border-slate-700 dark:bg-slate-950/40">
                        <span className="text-sm font-medium text-gray-800 dark:text-slate-100">{label}</span>
                        <input type="checkbox" checked={Boolean(form[key])} onChange={(event) => setField(key, event.target.checked as never)} className="h-5 w-5 rounded border-gray-300 bg-white text-blue-600 dark:border-slate-600 dark:bg-slate-950" />
                      </label>
                    ))}
                    <div className="pt-3">
                      <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-200">Admission highlights</p>
                      {form.admission_cta_items.map((item, index) => (
                        <div key={index} className="mb-2 flex gap-2">
                          <input value={item} onChange={(event) => setField('admission_cta_items', form.admission_cta_items.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                          <button type="button" onClick={() => setField('admission_cta_items', form.admission_cta_items.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg p-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setField('admission_cta_items', [...form.admission_cta_items, ''])} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><Plus className="h-4 w-4" /> Add highlight</button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
