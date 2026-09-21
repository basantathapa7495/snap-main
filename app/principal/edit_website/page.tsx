'use client';

import { useEffect, useMemo, useState } from 'react';
import NextImage from 'next/image';
import {
  AlertCircle, BookOpen, Check, Eye, LayoutTemplate, Loader2, Palette,
  Image as ImageIcon, ImagePlus, RefreshCw, Rocket, Settings, ShieldCheck, Trash2, Upload, UserRound,
} from 'lucide-react';

type GalleryImage = { id: string; image_url: string; label: string | null };
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

const DEFAULT_SCHOOL_MOTTO = 'Learning today. Leading tomorrow.';
const DEFAULT_SCHOOL_DESCRIPTION = 'A welcoming school community dedicated to quality education, strong values, and the confidence every student needs to succeed.';
const DEFAULT_ABOUT_TEXT = 'Our school is a caring and inclusive learning community where every child is encouraged to grow academically, socially and personally. We work closely with families to provide meaningful learning experiences, strong values and opportunities that prepare students for a successful future.';
const DEFAULT_MISSION = 'To provide a safe, supportive and engaging learning environment that develops knowledge, confidence, creativity and good character in every student.';
const DEFAULT_VISION = 'To become a trusted centre of learning where students are inspired to achieve their potential and grow into responsible, capable and compassionate citizens.';
const DEFAULT_FACILITIES = 'Bright classrooms, a well-stocked library, science and computer learning spaces, safe play areas and supportive resources designed for effective learning.';
const DEFAULT_ACTIVITIES = 'Sports, arts, cultural programmes, clubs, educational visits and community activities that help students discover talents, build teamwork and develop leadership skills.';
const DEFAULT_PRINCIPAL_MESSAGE = 'Welcome to our school. We are committed to creating a safe, inspiring and inclusive learning environment where every student can discover their strengths, build strong character and prepare confidently for the future.';

type ExperienceItem = { title: string; desc: string };
type AchievementStat = { label: string; value: string };

const DEFAULT_EXPERIENCE: ExperienceItem[] = [
  { title: 'Quality education', desc: 'Dedicated teachers and thoughtful learning that help every student build strong foundations.' },
  { title: 'Excellent results', desc: 'Focused academic support and regular progress tracking that encourage students to achieve their best.' },
  { title: 'Modern learning', desc: 'Practical, creative and technology-supported lessons designed for today’s learners.' },
  { title: 'Safe environment', desc: 'A caring, inclusive and disciplined community where every student feels respected and supported.' },
];

const DEFAULT_ACHIEVEMENTS: AchievementStat[] = [
  { label: 'Students graduated', value: '500+' },
  { label: 'Qualified teachers', value: '25+' },
  { label: 'Awards won', value: '12+' },
  { label: 'Years of excellence', value: '15+' },
];

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
  principal_image_url: string;
  mission: string;
  vision: string;
  theme_color: string;
  logo_url: string;
  banner_url: string;
  phone: string;
  email: string;
  address: string;
  map_location: string;
  office_hours: string;
  facebook: string;
  instagram: string;
  youtube: string;
  facilities: string;
  activities: string;
  why_choose_us: ExperienceItem[];
  achievement_stats: AchievementStat[];
  website_template: 'classic' | 'modern' | 'bold';
};

const emptyForm: SchoolForm = {
  name: '', slug: '', school_type: '', school_level: '', established_year: '',
  principal: '', motto: DEFAULT_SCHOOL_MOTTO, short_description: DEFAULT_SCHOOL_DESCRIPTION, about_text: DEFAULT_ABOUT_TEXT,
  principal_message: DEFAULT_PRINCIPAL_MESSAGE, principal_image_url: '', mission: DEFAULT_MISSION, vision: DEFAULT_VISION, theme_color: 'blue',
  logo_url: '', banner_url: '', phone: '', email: '', address: '', map_location: '',
  office_hours: '', facebook: '', instagram: '', youtube: '', facilities: DEFAULT_FACILITIES, activities: DEFAULT_ACTIVITIES,
  why_choose_us: DEFAULT_EXPERIENCE,
  achievement_stats: DEFAULT_ACHIEVEMENTS,
  website_template: 'modern',
};

const tabs = [
  { id: 'basic', label: 'Basic information', icon: Settings },
  { id: 'about', label: 'About and mission', icon: BookOpen },
  { id: 'template', label: 'Website template', icon: LayoutTemplate },
  { id: 'branding', label: 'Contact and map', icon: Palette },
] as const;

type TabId = (typeof tabs)[number]['id'];

const inputClass = 'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';
const labelClass = 'block text-sm font-semibold text-gray-700';

export default function WebsiteEditorPage() {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [form, setForm] = useState<SchoolForm>(emptyForm);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [publishedSlug, setPublishedSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPrincipalPhoto, setUploadingPrincipalPhoto] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [removingGalleryId, setRemovingGalleryId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const previewHref = useMemo(() => publishedSlug ? `/s/${publishedSlug}` : '', [publishedSlug]);

  const update = <K extends keyof SchoolForm>(field: K, value: SchoolForm[K]) => {
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
        .select('name, slug, school_type, school_level, established_year, principal, motto, short_description, about_text, principal_message, principal_image_url, mission, vision, theme_color, logo_url, banner_url, phone, email, address, map_location, office_hours, facebook, instagram, youtube, facilities, activities, why_choose_us, achievement_stats')
        .eq('id', profile.school_id)
        .single();

      if (schoolError) throw schoolError;
      const { data: galleryData, error: galleryError } = await supabase
        .from('gallery_images')
        .select('id,image_url,label')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false })
        .limit(8);
      if (galleryError) throw galleryError;
      const storedTheme = school.theme_color ?? 'blue';
      const [themeColor, storedTemplate] = storedTheme.includes(':') ? storedTheme.split(':') : [storedTheme, 'modern'];
      const publishedForm: SchoolForm = {
        name: school.name ?? '', slug: school.slug ?? '', school_type: school.school_type ?? '',
        school_level: school.school_level ?? '', established_year: school.established_year?.toString() ?? '',
        principal: school.principal ?? '', motto: school.motto?.trim() || DEFAULT_SCHOOL_MOTTO,
        short_description: school.short_description?.trim() || DEFAULT_SCHOOL_DESCRIPTION, about_text: school.about_text?.trim() || DEFAULT_ABOUT_TEXT,
        principal_message: school.principal_message?.trim() || DEFAULT_PRINCIPAL_MESSAGE, principal_image_url: school.principal_image_url ?? '', mission: school.mission?.trim() || DEFAULT_MISSION, vision: school.vision?.trim() || DEFAULT_VISION,
        theme_color: themeColor || 'blue', logo_url: school.logo_url ?? '', banner_url: school.banner_url ?? '',
        phone: school.phone ?? '', email: school.email ?? '', address: school.address ?? '', map_location: school.map_location ?? '',
        office_hours: school.office_hours ?? '', facebook: school.facebook ?? '', instagram: school.instagram ?? '',
        youtube: school.youtube ?? '', facilities: school.facilities?.trim() || DEFAULT_FACILITIES, activities: school.activities?.trim() || DEFAULT_ACTIVITIES,
        why_choose_us: normalizeExperience(school.why_choose_us),
        achievement_stats: normalizeAchievements(school.achievement_stats),
        website_template: storedTemplate === 'classic' || storedTemplate === 'bold' ? storedTemplate : 'modern',
      };
      setSchoolId(profile.school_id);
      setPublishedSlug(publishedForm.slug);
      setGalleryImages(galleryData ?? []);
      setForm(publishedForm);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load your school website.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadSchool(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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

      setForm((current) => ({ ...current, logo_url: logoUrl }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not upload the school logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const uploadPrincipalPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !schoolId) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Please choose a PNG, JPG or WebP principal photo.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('The principal photo must be smaller than 5 MB.');
      return;
    }

    setUploadingPrincipalPhoto(true);
    setSaved(false);
    setError('');
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${schoolId}/principal/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('school-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('school-assets')
        .getPublicUrl(filePath);
      const principalImageUrl = publicUrlData.publicUrl;

      setForm((current) => ({ ...current, principal_image_url: principalImageUrl }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not upload the principal photo.');
    } finally {
      setUploadingPrincipalPhoto(false);
    }
  };

  const uploadGalleryImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!selectedFiles.length || !schoolId) return;

    const remainingSlots = 8 - galleryImages.length;
    if (remainingSlots <= 0) {
      setError('You can add a maximum of 8 school photos. Remove one before uploading another.');
      return;
    }
    if (selectedFiles.length > remainingSlots) {
      setError(`You can add ${remainingSlots} more photo${remainingSlots === 1 ? '' : 's'}.`);
      return;
    }
    if (selectedFiles.some((file) => !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))) {
      setError('Please choose only PNG, JPG or WebP photos.');
      return;
    }
    if (selectedFiles.some((file) => file.size > 5 * 1024 * 1024)) {
      setError('Each school photo must be smaller than 5 MB.');
      return;
    }

    setUploadingGallery(true);
    setError('');
    try {
      const newImages: GalleryImage[] = [];
      for (const file of selectedFiles) {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `${schoolId}/gallery/${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('school-assets').upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('school-assets').getPublicUrl(filePath);
        const label = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'School photo';
        const { data: galleryRow, error: insertError } = await supabase
          .from('gallery_images')
          .insert({ school_id: schoolId, image_url: publicUrlData.publicUrl, label })
          .select('id,image_url,label')
          .single();
        if (insertError) throw insertError;
        newImages.push(galleryRow);
      }
      setGalleryImages((current) => [...current, ...newImages].slice(0, 8));
      setSaved(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not upload the school photos.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = async (image: GalleryImage) => {
    if (!schoolId) return;
    setRemovingGalleryId(image.id);
    setError('');
    try {
      const { error: deleteError } = await supabase.from('gallery_images').delete().eq('id', image.id).eq('school_id', schoolId);
      if (deleteError) throw deleteError;
      setGalleryImages((current) => current.filter((item) => item.id !== image.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not remove this school photo.');
    } finally {
      setRemovingGalleryId(null);
    }
  };

  const previewWebsite = () => {
    if (!previewHref) return;
    window.open(previewHref, '_blank', 'noopener,noreferrer');
  };

  const publishWebsite = async () => {
    if (!schoolId) return;
    if (!form.name.trim() || !form.slug.trim()) {
      setError('School name and website slug are required.');
      return;
    }
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const { website_template, ...publicFields } = form;
      const payload = {
        ...publicFields,
        theme_color: `${form.theme_color}:${website_template}`,
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
      setPublishedSlug(data.slug);
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not publish the website changes.');
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
                  <button type="button" onClick={previewWebsite} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
                    <Eye className="h-4 w-4" /> Preview website
                  </button>
                ) : (
                  <button disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400"><Eye className="h-4 w-4" /> Preview website</button>
                )}
                <button onClick={publishWebsite} disabled={loading || saving || !schoolId} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  {saving ? 'Saving…' : 'Save website'}
                </button>
              </div>
            </div>

            {error && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1"><p className="font-semibold">Website editor needs attention</p><p className="mt-0.5">{error}</p></div><button onClick={loadSchool} className="inline-flex items-center gap-1 font-semibold"><RefreshCw className="h-4 w-4" /> Retry</button></div>}
            {saved && !error && <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><ShieldCheck className="h-5 w-5" /><span>Your website is saved and visible to families.</span></div>}

            {loading ? (
              <div className="flex min-h-80 items-center justify-center rounded-3xl border border-gray-200 bg-white"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /><span className="ml-3 text-sm font-medium text-gray-600">Loading your website…</span></div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-2 shadow-sm lg:sticky lg:top-28">
                  {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Icon className="h-4 w-4" />{tab.label}</button>; })}
                </aside>

                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
                  {activeTab === 'basic' && <div className="space-y-6"><SectionTitle title="Basic information" description="The main identity and introduction shown on your website." /><div className="grid gap-5 sm:grid-cols-2"><Field label="School name" value={form.name} onChange={(v) => update('name', v)} required /><Field label="Website slug" value={form.slug} onChange={(v) => update('slug', v)} prefix="nepsom.xyz/s/" required /><Field label="School type" value={form.school_type} onChange={(v) => update('school_type', v)} /><Field label="School level" value={form.school_level} onChange={(v) => update('school_level', v)} /><Field label="Established year (B.S.)" value={form.established_year} onChange={(v) => update('established_year', v)} type="number" /><Field label="Principal name" value={form.principal} onChange={(v) => update('principal', v)} /><Field label="School motto" value={form.motto} onChange={(v) => update('motto', v)} wide /><TextArea label="Short description" value={form.short_description} onChange={(v) => update('short_description', v)} rows={3} wide /></div></div>}
                  {activeTab === 'about' && (
                    <div className="space-y-7">
                      <SectionTitle title="About and school experience" description="Edit the story, leadership message, achievements and experience families see on your About section." />

                      <div className="grid gap-5">
                        <TextArea label="About the school" value={form.about_text} onChange={(v) => update('about_text', v)} rows={5} />
                        <p className="-mt-2 text-xs leading-5 text-gray-500">The public page automatically adds your school name and established year before this text.</p>

                        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 sm:p-6">
                          <div className="grid gap-5 sm:grid-cols-[112px_1fr] sm:items-start">
                            <div className="flex flex-col items-center gap-3">
                              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md ring-1 ring-blue-100">
                                {form.principal_image_url ? <NextImage src={form.principal_image_url} alt="Principal preview" width={112} height={112} unoptimized className="h-full w-full object-cover" /> : <UserRound className="h-12 w-12 text-blue-300" strokeWidth={1.7} />}
                              </div>
                              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition ${uploadingPrincipalPhoto ? 'cursor-wait bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {uploadingPrincipalPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                {uploadingPrincipalPhoto ? 'Uploading…' : form.principal_image_url ? 'Replace photo' : 'Upload photo'}
                                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadPrincipalPhoto} disabled={uploadingPrincipalPhoto || !schoolId} className="sr-only" />
                              </label>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-950">Principal’s message card</h3>
                              <p className="mt-1 text-sm leading-6 text-gray-600">The principal name comes from Basic information. Add a warm, personal welcome below.</p>
                              <div className="mt-4"><TextArea label="Message" value={form.principal_message} onChange={(v) => update('principal_message', v)} rows={5} /></div>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <TextArea label="Our mission" value={form.mission} onChange={(v) => update('mission', v)} rows={5} />
                          <TextArea label="Our vision" value={form.vision} onChange={(v) => update('vision', v)} rows={5} />
                        </div>

                        <EditorGroup title="Achievement numbers" description="Use short values such as 500+, 25+ or 15 years.">
                          <div className="grid gap-4 sm:grid-cols-2">
                            {form.achievement_stats.map((stat, index) => (
                              <div key={index} className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                                <div className="grid grid-cols-[110px_1fr] gap-3">
                                  <Field label="Value" value={stat.value} onChange={(value) => update('achievement_stats', form.achievement_stats.map((item, itemIndex) => itemIndex === index ? { ...item, value } : item))} />
                                  <Field label="Label" value={stat.label} onChange={(label) => update('achievement_stats', form.achievement_stats.map((item, itemIndex) => itemIndex === index ? { ...item, label } : item))} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </EditorGroup>

                        <EditorGroup title="School experience cards" description="Edit the four main reasons families should choose your school.">
                          <div className="grid gap-4 sm:grid-cols-2">
                            {form.why_choose_us.map((item, index) => (
                              <div key={index} className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                                <Field label={`Card ${index + 1} title`} value={item.title} onChange={(title) => update('why_choose_us', form.why_choose_us.map((card, cardIndex) => cardIndex === index ? { ...card, title } : card))} />
                                <div className="mt-3"><TextArea label="Description" value={item.desc} onChange={(desc) => update('why_choose_us', form.why_choose_us.map((card, cardIndex) => cardIndex === index ? { ...card, desc } : card))} rows={3} /></div>
                              </div>
                            ))}
                          </div>
                        </EditorGroup>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <TextArea label="Facilities" value={form.facilities} onChange={(v) => update('facilities', v)} rows={4} />
                          <TextArea label="Activities" value={form.activities} onChange={(v) => update('activities', v)} rows={4} />
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'template' && <div className="space-y-6"><SectionTitle title="Choose a website template" description="Your content stays the same. Only the visual presentation changes." /><div className="grid gap-4 md:grid-cols-3">{([
                    { id: 'modern', name: 'Modern', description: 'Clean cards, soft corners and a balanced school-first layout.', accent: 'from-blue-600 to-indigo-600' },
                    { id: 'classic', name: 'Classic', description: 'Formal styling and a traditional academic presentation.', accent: 'from-slate-800 to-blue-900' },
                    { id: 'bold', name: 'Bold', description: 'Large photography, stronger colour and energetic sections.', accent: 'from-violet-600 to-fuchsia-600' },
                  ] as const).map((template) => <button key={template.id} type="button" onClick={() => update('website_template', template.id)} className={`overflow-hidden rounded-2xl border-2 bg-white text-left transition hover:-translate-y-1 hover:shadow-lg ${form.website_template === template.id ? 'border-blue-600 ring-4 ring-blue-600/10' : 'border-gray-200'}`}><span className={`block h-24 bg-gradient-to-br ${template.accent}`}><span className="block px-4 pt-5 text-2xl font-black text-white">Aa</span><span className="ml-4 mt-2 block h-2 w-24 rounded bg-white/70" /><span className="ml-4 mt-2 block h-2 w-16 rounded bg-white/40" /></span><span className="block p-4"><span className="flex items-center justify-between font-bold text-gray-950">{template.name}{form.website_template === template.id && <Check className="h-5 w-5 text-blue-600" />}</span><span className="mt-1.5 block text-sm leading-5 text-gray-500">{template.description}</span></span></button>)}</div></div>}
                  {activeTab === 'branding' && <div className="space-y-6"><SectionTitle title="Contact, map and branding" description="Add the school’s contact details and Google Maps link, then control the website’s visual style." /><div><label className={labelClass}>Theme colour</label><div className="mt-3 flex flex-wrap gap-3">{['blue','emerald','purple','red','amber','teal'].map((color) => <button key={color} type="button" onClick={() => update('theme_color', color)} aria-label={`Use ${color} theme`} className={`h-11 w-11 rounded-full border-4 shadow-sm transition ${form.theme_color === color ? 'scale-110 border-gray-900' : 'border-white ring-1 ring-gray-200'}`} style={{ backgroundColor: color === 'blue' ? '#2563eb' : color === 'emerald' ? '#059669' : color === 'purple' ? '#9333ea' : color === 'red' ? '#dc2626' : color === 'amber' ? '#d97706' : '#0d9488' }} />)}</div></div><div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-lg ring-1 ring-blue-100">
                        {form.logo_url ? (
                          <NextImage src={form.logo_url} alt="School logo preview" width={96} height={96} unoptimized className="h-full w-full rounded-full object-cover" />
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
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-blue-600" /><h3 className="font-bold text-gray-950">School photo gallery</h3></div>
                        <p className="mt-1 text-sm leading-6 text-gray-600">Add up to 8 photos of your school, students, activities or campus. All photos appear in Gallery, and the first 5 also rotate in the hero.</p>
                      </div>
                      <label className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${uploadingGallery || galleryImages.length >= 8 ? 'cursor-not-allowed bg-blue-300' : 'bg-blue-600 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md'}`}>
                        {uploadingGallery ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                        {uploadingGallery ? 'Uploading…' : `Add photos (${galleryImages.length}/8)`}
                        <input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={uploadGalleryImages} disabled={uploadingGallery || galleryImages.length >= 8 || !schoolId} className="sr-only" />
                      </label>
                    </div>
                    {galleryImages.length > 0 ? <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">{galleryImages.map((image, index) => <figure key={image.id} className="group relative overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm ring-1 ring-blue-200"><NextImage src={image.image_url} alt={image.label || `School photo ${index + 1}`} width={640} height={480} unoptimized className="aspect-[4/3] h-full w-full object-cover" /><figcaption className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-gray-950/75 to-transparent px-3 pb-3 pt-8 text-xs font-semibold text-white">{image.label || `Photo ${index + 1}`}</figcaption><span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-1 text-xs font-bold text-gray-700 shadow-sm">{index + 1}</span><button type="button" onClick={() => removeGalleryImage(image)} disabled={removingGalleryId === image.id} aria-label={`Remove ${image.label || `school photo ${index + 1}`}`} className="absolute right-3 top-3 rounded-lg bg-white/95 p-2 text-red-600 opacity-100 shadow-sm transition hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 disabled:cursor-wait"><Trash2 className="h-4 w-4" /></button></figure>)}</div> : <div className="mt-5 flex min-h-32 items-center justify-center rounded-xl border border-dashed border-blue-200 bg-white px-5 text-center text-sm text-gray-500">No hero photos yet. Add your first photo to create the school website slider.</div>}
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Logo image URL (optional)" value={form.logo_url} onChange={(v) => update('logo_url', v)} type="url" />
                    <Field label="Phone" value={form.phone} onChange={(v) => update('phone', v)} />
                    <Field label="Email" value={form.email} onChange={(v) => update('email', v)} type="email" />
                    <Field label="Address" value={form.address} onChange={(v) => update('address', v)} wide />
                    <div className="sm:col-span-2">
                      <Field label="Google Maps location link" value={form.map_location} onChange={(v) => update('map_location', v)} type="url" />
                      <p className="mt-2 text-xs leading-5 text-gray-500">Open your school in Google Maps, copy its link and paste it here. The public website will show a satellite map and directions button.</p>
                    </div>
                    <Field label="Office hours" value={form.office_hours} onChange={(v) => update('office_hours', v)} wide />
                    <Field label="Facebook URL" value={form.facebook} onChange={(v) => update('facebook', v)} type="url" />
                    <Field label="Instagram URL" value={form.instagram} onChange={(v) => update('instagram', v)} type="url" />
                    <Field label="YouTube URL" value={form.youtube} onChange={(v) => update('youtube', v)} type="url" />
                  </div></div>}
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
function EditorGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div className="rounded-2xl border border-gray-200 p-5"><div className="mb-4"><h3 className="font-bold text-gray-950">{title}</h3><p className="mt-1 text-sm text-gray-500">{description}</p></div>{children}</div>; }
function Field({ label, value, onChange, type = 'text', wide = false, required = false, prefix }: { label: string; value: string; onChange: (value: string) => void; type?: string; wide?: boolean; required?: boolean; prefix?: string }) { return <label className={wide ? 'sm:col-span-2' : ''}><span className={labelClass}>{label}{required && <span className="text-red-500"> *</span>}</span>{prefix ? <div className="mt-1.5 flex overflow-hidden rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10"><span className="flex items-center bg-gray-50 px-3 text-xs text-gray-500">{prefix}</span><input className="min-w-0 flex-1 px-3.5 py-2.5 text-sm outline-none" value={value} onChange={(e) => onChange(e.target.value)} required={required} /></div> : <input className={inputClass} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />}</label>; }
function TextArea({ label, value, onChange, rows, wide = false }: { label: string; value: string; onChange: (value: string) => void; rows: number; wide?: boolean }) { return <label className={wide ? 'sm:col-span-2' : ''}><span className={labelClass}>{label}</span><textarea className={`${inputClass} resize-y`} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }

function normalizeExperience(value: unknown): ExperienceItem[] {
  if (!Array.isArray(value)) return DEFAULT_EXPERIENCE.map((item) => ({ ...item }));
  return DEFAULT_EXPERIENCE.map((fallback, index) => {
    const item = value[index];
    if (!item || typeof item !== 'object') return { ...fallback };
    const record = item as Record<string, unknown>;
    return {
      title: typeof record.title === 'string' && record.title.trim() ? record.title : fallback.title,
      desc: typeof record.desc === 'string' && record.desc.trim() ? record.desc : typeof record.description === 'string' && record.description.trim() ? record.description : fallback.desc,
    };
  });
}

function normalizeAchievements(value: unknown): AchievementStat[] {
  if (!Array.isArray(value)) return DEFAULT_ACHIEVEMENTS.map((item) => ({ ...item }));
  return DEFAULT_ACHIEVEMENTS.map((fallback, index) => {
    const item = value[index];
    if (!item || typeof item !== 'object') return { ...fallback };
    const record = item as Record<string, unknown>;
    return {
      label: typeof record.label === 'string' && record.label.trim() ? record.label : fallback.label,
      value: typeof record.value === 'string' && record.value.trim() ? record.value : fallback.value,
    };
  });
}
