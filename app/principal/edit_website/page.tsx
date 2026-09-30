'use client';

import { useEffect, useMemo, useState } from 'react';
import NextImage from 'next/image';
import {
  AlertCircle, BookOpen, ChevronLeft, ChevronRight, Eye, Globe2, GraduationCap, LayoutTemplate, Loader2, MapPin,
  Image as ImageIcon, RefreshCw, Rocket, Settings, Trash2, Upload, UserRound, FileText,
} from 'lucide-react';

type GalleryImage = { id: string; image_url: string; label: string | null };
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

type ExperienceItem = { title: string; desc: string };
type AchievementStat = { label: string; value: string };
const blankExperience = () => Array.from({length:4},()=>({title:'',desc:''}));
const blankAchievements = () => Array.from({length:4},()=>({label:'',value:''}));

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
  principal: '', motto: '', short_description: '', about_text: '',
  principal_message: '', principal_image_url: '', mission: '', vision: '', theme_color: 'blue',
  logo_url: '', banner_url: '', phone: '', email: '', address: '', map_location: '',
  office_hours: '', facebook: '', instagram: '', youtube: '', facilities: '', activities: '',
  why_choose_us: blankExperience(),
  achievement_stats: blankAchievements(),
  website_template: 'modern',
};

const tabs = [
  { id: 'basic', label: 'Basic information', icon: Settings, description: 'School name, logo, tagline' },
  { id: 'about', label: 'About and mission', icon: BookOpen, description: 'About school, vision and mission' },
  { id: 'home', label: 'Homepage content', icon: ImageIcon, description: 'Hero, highlights, gallery and updates' },
  { id: 'template', label: 'Website template', icon: LayoutTemplate, description: 'Choose and customize design' },
  { id: 'pages', label: 'Pages', icon: FileText, description: 'Manage website sections' },
  { id: 'branding', label: 'Contact and map', icon: MapPin, description: 'Address, phone, email and location' },
  { id: 'advanced', label: 'Advanced settings', icon: Settings, description: 'Theme and social links' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-200';

export default function WebsiteEditorPage() {
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [form, setForm] = useState<SchoolForm>(emptyForm);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [publishedSlug, setPublishedSlug] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [editorUserId, setEditorUserId] = useState('');
  const [editorName, setEditorName] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [lastUpdatedBy, setLastUpdatedBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPrincipalPhoto, setUploadingPrincipalPhoto] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [pendingGallery, setPendingGallery] = useState<{file:File;image_url:string;id:string;label:string}[]>([]);
  const [removedGalleryIds, setRemovedGalleryIds] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');

  const previewHref = useMemo(() => publishedSlug ? `/s/${publishedSlug}` : '', [publishedSlug]);

  const update = <K extends keyof SchoolForm>(field: K, value: SchoolForm[K]) => {
    setSaved(false); setDirty(true);
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
        .select('school_id, role, full_name')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.school_id) throw new Error('Your account is not connected to a school.');
      if (profile.role !== 'admin' && profile.role !== 'principal') {
        throw new Error('Only a school administrator can edit the public website.');
      }

      setEditorUserId(userData.user.id); setEditorName(profile.full_name || userData.user.email || 'Principal');
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('website_updated_at, website_updated_by, is_approved, name, slug, school_type, school_level, established_year, principal, motto, short_description, about_text, principal_message, principal_image_url, mission, vision, theme_color, logo_url, banner_url, phone, email, address, map_location, office_hours, facebook, instagram, youtube, facilities, activities, why_choose_us, achievement_stats')
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
        principal: school.principal ?? '', motto: school.motto?.trim() || '',
        short_description: school.short_description?.trim() || '', about_text: school.about_text?.trim() || '',
        principal_message: school.principal_message?.trim() || '', principal_image_url: school.principal_image_url ?? '', mission: school.mission?.trim() || '', vision: school.vision?.trim() || '',
        theme_color: themeColor || 'blue', logo_url: school.logo_url ?? '', banner_url: school.banner_url ?? '',
        phone: school.phone ?? '', email: school.email ?? '', address: school.address ?? '', map_location: school.map_location ?? '',
        office_hours: school.office_hours ?? '', facebook: school.facebook ?? '', instagram: school.instagram ?? '',
        youtube: school.youtube ?? '', facilities: school.facilities?.trim() || '', activities: school.activities?.trim() || '',
        why_choose_us: normalizeExperience(school.why_choose_us),
        achievement_stats: normalizeAchievements(school.achievement_stats),
        website_template: storedTemplate === 'classic' || storedTemplate === 'bold' ? storedTemplate : 'modern',
      };
      setIsApproved(Boolean(school.is_approved)); setLastUpdatedAt(school.website_updated_at);
      if (school.website_updated_by) { const {data:updater}=await supabase.from('profiles').select('full_name').eq('user_id',school.website_updated_by).maybeSingle();setLastUpdatedBy(updater?.full_name || 'Principal'); } else setLastUpdatedBy('');
      setDirty(false); setSaved(false);
      setSchoolId(profile.school_id);
      setPublishedSlug(publishedForm.slug);
      setGalleryImages(galleryData ?? []); setPendingGallery([]); setRemovedGalleryIds([]);
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
    setSaved(false); setDirty(true);
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
    setSaved(false); setDirty(true);
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

  const uploadGalleryImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []); event.target.value = '';
    if (!files.length) return;
    if (files.length + galleryImages.length + pendingGallery.length > 8) { setError('You can add a maximum of 8 school photos.'); return; }
    if (files.some(file => !['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 5*1024*1024)) { setError('Choose PNG, JPG or WebP images, each under 5 MB.'); return; }
    setPendingGallery(current => [...current,...files.map(file => ({file,id:crypto.randomUUID(),image_url:URL.createObjectURL(file),label:file.name.replace(/\.[^.]+$/,'')}))]);
    setDirty(true); setSaved(false); setError('');
  };
  const removeGalleryImage = (image: GalleryImage) => {
    if (pendingGallery.some(item => item.id === image.id)) setPendingGallery(current => current.filter(item => { if (item.id === image.id) URL.revokeObjectURL(item.image_url); return item.id !== image.id; }));
    else { setGalleryImages(current => current.filter(item => item.id !== image.id)); setRemovedGalleryIds(current => [...current,image.id]); }
    setDirty(true); setSaved(false);
  };
  const uploadBanner = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file=event.target.files?.[0]; event.target.value=''; if(!file || !schoolId)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>5*1024*1024){setError('Choose a PNG, JPG or WebP hero image under 5 MB.');return;}
    setUploadingGallery(true); setError('');
    try {const path=`${schoolId}/hero/${crypto.randomUUID()}.${file.name.split('.').pop()?.toLowerCase() || 'jpg'}`;const {error}=await supabase.storage.from('school-assets').upload(path,file,{upsert:false});if(error)throw error;update('banner_url',supabase.storage.from('school-assets').getPublicUrl(path).data.publicUrl);}
    catch(reason){setError(reason instanceof Error?reason.message:'Could not upload hero image.');}
    finally{setUploadingGallery(false);}
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
    setSaved(false); setDirty(true);
    setError('');
    try {
      const { website_template, ...publicFields } = form;
      const payload = {
        ...publicFields,
        website_updated_at: new Date().toISOString(), website_updated_by: editorUserId,
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
      setPublishedSlug(data.slug); setLastUpdatedAt(payload.website_updated_at); setLastUpdatedBy(editorName);
      for (const image of pendingGallery) {
        const path=`${schoolId}/gallery/${crypto.randomUUID()}.${image.file.name.split('.').pop()?.toLowerCase() || 'jpg'}`;
        const uploaded=await supabase.storage.from('school-assets').upload(path,image.file,{upsert:false});
        if(uploaded.error)throw uploaded.error;
        const url=supabase.storage.from('school-assets').getPublicUrl(path).data.publicUrl;
        const inserted=await supabase.from('gallery_images').insert({school_id:schoolId,image_url:url,label:image.label}).select('id,image_url,label').single();
        if(inserted.error)throw inserted.error;
        setGalleryImages(current=>[...current,inserted.data]);
        setPendingGallery(current=>current.filter(item=>item.id!==image.id)); URL.revokeObjectURL(image.image_url);
      }
      for(const id of removedGalleryIds){const removed=await supabase.from('gallery_images').delete().eq('school_id',schoolId).eq('id',id);if(removed.error)throw removed.error;setRemovedGalleryIds(current=>current.filter(value=>value!==id));}
      setPendingGallery([]);setRemovedGalleryIds([]);
      setSaved(true); setDirty(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not publish the website changes.');
    } finally {
      setSaving(false);
    }
  };

  const selected = tabs.find(tab => tab.id === activeTab);
  const templateOptions = [
    {id:'modern' as const,name:'Modern',accent:'from-blue-600 to-sky-400'},
    {id:'classic' as const,name:'Classic',accent:'from-slate-700 to-blue-900'},
    {id:'bold' as const,name:'Bold',accent:'from-violet-700 to-fuchsia-600'},
  ];
  const previewTemplate = (template: typeof templateOptions[number]) => <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700"><div className="flex items-center justify-between gap-1 bg-white px-2 py-1.5 text-[9px] font-bold text-slate-900"><span className="flex items-center gap-1">{form.logo_url ? <NextImage src={form.logo_url} alt="School logo" width={20} height={20} unoptimized className="h-5 w-5 object-contain" /> : <GraduationCap className="h-4 w-4 text-blue-600" />}{form.name || 'Your school'}</span><span className="text-[8px] text-slate-400">Home · About · Contact</span></div><div className={`relative flex min-h-32 flex-col justify-center bg-gradient-to-r ${template.accent} p-4 text-white sm:min-h-44`}>{(galleryImages[0]?.image_url || pendingGallery[0]?.image_url) ? <NextImage src={galleryImages[0]?.image_url || pendingGallery[0]?.image_url} alt="School hero" fill unoptimized className="object-cover opacity-50" /> : null}<div className="relative"><strong className="block max-w-sm text-base leading-tight sm:text-xl">{form.motto || form.name || 'Your school website'}</strong><p className="mt-1 line-clamp-2 max-w-sm text-[10px] opacity-90">{form.short_description || 'Your school description will appear here.'}</p><span className="mt-2 inline-block rounded bg-white px-2 py-1 text-[9px] font-bold text-blue-700">Learn more</span></div></div><div className="grid grid-cols-3 gap-1 bg-white p-2">{form.why_choose_us.slice(0,3).map((item,index) => <span key={index} className="truncate rounded bg-blue-50 p-2 text-center text-[9px] text-blue-800">{item.title || 'Highlight'}</span>)}</div></div>;
  return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"><Sidebar /><div className="flex min-h-screen flex-col pt-10 lg:ml-64"><TopBar /><main className="flex-1 px-3 pb-24 pt-7 sm:px-6 lg:px-8 lg:pt-24"><div className="mx-auto max-w-6xl">
    {!activeTab ? <><header className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-100 p-3 dark:border-blue-900 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950"><Globe2 className="absolute -right-1 -bottom-5 h-24 w-24 text-blue-200/60 dark:text-blue-900/40" /><div className="relative"><p className="text-xs font-semibold text-blue-600">Public website</p><h1 className="text-xl font-extrabold sm:text-2xl">Website editor</h1><p className="max-w-xs text-xs text-slate-600 dark:text-slate-300">Changes appear on your school’s public NEPSOM page.</p></div></header><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={previewWebsite} disabled={!previewHref} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"><Eye className="h-4 w-4" />Preview website</button><button type="button" onClick={() => void publishWebsite()} disabled={loading || saving || !schoolId || !dirty || uploadingLogo || uploadingPrincipalPhoto || uploadingGallery} className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 p-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}{saving ? 'Saving…' : 'Save website'}</button></div><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{[{label:'Website',value:isApproved && publishedSlug ? 'Published':'Unpublished',icon:Globe2},{label:'Template',value:form.website_template,icon:LayoutTemplate},{label:'Last updated',value:lastUpdatedAt ? new Intl.DateTimeFormat('en-NP',{dateStyle:'medium',timeZone:'Asia/Kathmandu'}).format(new Date(lastUpdatedAt)) : 'Not yet saved',icon:RefreshCw},{label:'Updated by',value:lastUpdatedBy || 'Not yet saved',icon:UserRound}].map(item => <div key={item.label} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900"><item.icon className="h-4 w-4 shrink-0 text-blue-600" /><span className="min-w-0"><strong className="block truncate text-xs capitalize">{item.value}</strong><small className="block text-[10px] text-slate-500">{item.label}</small></span></div>)}</div></> : <header className="flex items-center gap-2"><button type="button" onClick={() => setActiveTab(null)} aria-label="Back to website sections" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="h-5 w-5" /></button><div><h1 className="text-base font-bold">{selected?.label}</h1><p className="text-xs text-slate-500">{selected?.description}</p></div></header>}
    {error && <div role="alert" className="mt-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950 dark:text-red-300"><AlertCircle className="mr-1 inline h-4 w-4" />{error}</div>}{saved && !error && <p role="status" className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Website saved.</p>}{dirty && !saved && <p role="status" className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">Unsaved changes · use Save website when ready.</p>}
    {loading ? <div className="mt-3 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Loading website…</div> : !activeTab ? <nav aria-label="Website editor sections" className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">{tabs.map(tab => { const Icon=tab.icon;return <button type="button" key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-slate-800"><Icon className="h-5 w-5 shrink-0 text-blue-600" /><span className="min-w-0 flex-1"><strong className="block text-xs">{tab.label}</strong><small className="block text-[10px] text-slate-500">{tab.description}</small></span><ChevronRight className="h-4 w-4 text-slate-400" /></button>;})}</nav> : <div className="mt-3 grid gap-3 lg:grid-cols-[190px_1fr]"><nav aria-label="Editor sections" className="hidden h-fit rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 lg:block">{tabs.map(tab => <button type="button" key={tab.id} onClick={() => setActiveTab(tab.id)} className={`block w-full rounded-lg px-2 py-2 text-left text-xs ${activeTab === tab.id ? 'bg-blue-50 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'text-slate-500'}`}>{tab.label}</button>)}</nav><section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      {activeTab === 'basic' && <div className="space-y-3"><div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"><span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 dark:bg-blue-950">{form.logo_url ? <NextImage src={form.logo_url} alt="School logo" width={64} height={64} unoptimized className="h-full w-full object-contain" /> : <ImageIcon className="h-6 w-6 text-blue-300" />}</span><div><strong className="text-xs">School logo</strong><div className="mt-1 flex flex-wrap gap-2"><label className="cursor-pointer rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700"><Upload className="mr-1 inline h-3.5 w-3.5" />{uploadingLogo ? 'Uploading…':'Change logo'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo} disabled={uploadingLogo} className="sr-only" /></label>{form.logo_url && <button type="button" onClick={() => update('logo_url','')} className="rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-600">Remove</button>}</div><small className="text-[10px] text-slate-500">PNG, JPG or WebP · up to 2 MB</small></div></div><div className="grid gap-3 sm:grid-cols-2"><Field label="School name" value={form.name} onChange={value => update('name',value)} required /><Field label="School type" value={form.school_type} onChange={value => update('school_type',value)} /><Field label="School level" value={form.school_level} onChange={value => update('school_level',value)} /><Field label="Established year (B.S.)" value={form.established_year} onChange={value => update('established_year',value)} type="number" /><Field label="Principal name" value={form.principal} onChange={value => update('principal',value)} /><Field label="Tagline / motto" value={form.motto} onChange={value => update('motto',value)} /><TextArea label="Short description" value={form.short_description} onChange={value => update('short_description',value)} rows={3} wide /></div></div>}
      {activeTab === 'about' && <div className="space-y-3"><TextArea label="About school" value={form.about_text} onChange={value => update('about_text',value)} rows={4} /><div className="flex items-center gap-2"><span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-blue-50">{form.principal_image_url ? <NextImage src={form.principal_image_url} alt="Principal" width={48} height={48} unoptimized className="h-full w-full object-cover" /> : <UserRound className="h-5 w-5 text-blue-500" />}</span><label className="cursor-pointer rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700"><Upload className="mr-1 inline h-3.5 w-3.5" />{uploadingPrincipalPhoto?'Uploading…':'Change principal photo'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadPrincipalPhoto} className="sr-only" /></label>{form.principal_image_url && <button type="button" onClick={() => update('principal_image_url','')} className="text-xs text-red-600">Remove</button>}</div><TextArea label="Principal message" value={form.principal_message} onChange={value => update('principal_message',value)} rows={4} /><div className="grid gap-3 sm:grid-cols-2"><TextArea label="Mission" value={form.mission} onChange={value => update('mission',value)} rows={3} /><TextArea label="Vision" value={form.vision} onChange={value => update('vision',value)} rows={3} /><TextArea label="Facilities" value={form.facilities} onChange={value => update('facilities',value)} rows={3} /><TextArea label="Activities / programs" value={form.activities} onChange={value => update('activities',value)} rows={3} /></div><EditorGroup title="Achievements" description="Use your school’s real figures.">{form.achievement_stats.map((item,index) => <div key={index} className="mb-2 grid grid-cols-2 gap-2"><Field label={`Value ${index+1}`} value={item.value} onChange={value => update('achievement_stats',form.achievement_stats.map((other,i) => i===index?{...other,value}:other))} /><Field label="Label" value={item.label} onChange={label => update('achievement_stats',form.achievement_stats.map((other,i) => i===index?{...other,label}:other))} /></div>)}</EditorGroup></div>}
      {activeTab === 'home' && <div className="space-y-3"><Field label="Hero title / motto" value={form.motto} onChange={value => update('motto',value)} /><TextArea label="Hero description" value={form.short_description} onChange={value => update('short_description',value)} rows={3} /><div><Field label="Hero image URL" value={form.banner_url} onChange={value => update('banner_url',value)} type="url" /><label className="mt-2 inline-flex cursor-pointer gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700"><Upload className="h-3.5 w-3.5" />Upload hero image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadBanner} className="sr-only" /></label></div><EditorGroup title="Homepage highlights" description="Edit the cards shown on the public page.">{form.why_choose_us.map((item,index) => <div key={index} className="mb-2 grid gap-2 sm:grid-cols-2"><Field label={`Highlight ${index+1}`} value={item.title} onChange={title => update('why_choose_us',form.why_choose_us.map((other,i) => i===index?{...other,title}:other))} /><Field label="Description" value={item.desc} onChange={desc => update('why_choose_us',form.why_choose_us.map((other,i) => i===index?{...other,desc}:other))} /></div>)}</EditorGroup><div className="flex items-center justify-between"><div><strong className="text-xs">School gallery</strong><p className="text-[10px] text-slate-500">First five photos rotate in the hero.</p></div><label className="cursor-pointer rounded-lg bg-blue-600 px-2 py-1.5 text-xs text-white">{uploadingGallery?'Uploading…':`Add photos (${galleryImages.length + pendingGallery.length}/8)`}<input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={uploadGalleryImages} disabled={uploadingGallery || galleryImages.length + pendingGallery.length>=8} className="sr-only" /></label></div><div className="grid grid-cols-3 gap-2">{[...galleryImages,...pendingGallery].map(image => <div key={image.id} className="relative"><NextImage src={image.image_url} alt={image.label||'School photo'} width={250} height={160} unoptimized className="aspect-[4/3] w-full rounded-lg object-cover" /><button type="button" onClick={() => removeGalleryImage(image)} aria-label="Remove photo" className="absolute right-1 top-1 rounded bg-white p-1 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div><p className="text-xs text-slate-500">Updates and news are managed from School Calendar. Teachers are currently shown on the public page; section visibility controls are unavailable in the existing schema.</p></div>}
      {activeTab === 'template' && <div className="space-y-3"><p className="text-xs text-slate-500">Selected template preview uses your current editor content. Open Preview website to see the last saved public version.</p>{previewTemplate(templateOptions.find(item => item.id===form.website_template) || templateOptions[0])}<div className="grid grid-cols-3 gap-2">{templateOptions.map(item => <button type="button" key={item.id} onClick={() => update('website_template',item.id)} className={`overflow-hidden rounded-lg border-2 text-left ${form.website_template===item.id?'border-blue-600':'border-slate-200 dark:border-slate-700'}`}><div className={`h-12 bg-gradient-to-r ${item.accent} p-2 text-xs font-bold text-white`}>{form.name || 'Your school'}</div><span className="block px-2 py-1 text-xs font-semibold">{form.website_template===item.id?'●':'○'} {item.name}</span></button>)}</div><div><span className="text-xs font-bold">Theme colour</span><div className="mt-2 flex gap-2">{['blue','emerald','purple','red','amber','teal'].map(color => <button type="button" key={color} aria-label={`${color} theme`} onClick={() => update('theme_color',color)} className={`h-7 w-7 rounded-full border-2 ${form.theme_color===color?'ring-2 ring-blue-500':'border-white'}`} style={{backgroundColor:color}} />)}</div></div></div>}
      {activeTab === 'pages' && <div className="space-y-2"><p className="text-xs text-slate-500">These sections are available on the public school page. Content is edited in the related editor sections.</p>{[{name:'Home',tab:'home' as TabId},{name:'About, mission and programs',tab:'about' as TabId},{name:'Gallery and updates',tab:'home' as TabId},{name:'Teachers',tab:'home' as TabId},{name:'Contact',tab:'branding' as TabId},{name:'Documents',tab:'pages' as TabId},{name:'Admissions',tab:'pages' as TabId}].map(item => <button type="button" key={item.name} onClick={() => setActiveTab(item.tab)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-2.5 text-left text-xs dark:border-slate-700">{item.name}<ChevronRight className="h-4 w-4" /></button>)}<p className="text-[10px] text-slate-500">Page visibility and custom page creation are not supported by the current public website schema.</p></div>}
      {activeTab === 'branding' && <div className="grid gap-3 sm:grid-cols-2"><Field label="Phone" value={form.phone} onChange={value => update('phone',value)} /><Field label="Email" value={form.email} onChange={value => update('email',value)} type="email" /><Field label="Address" value={form.address} onChange={value => update('address',value)} wide /><Field label="Google Maps location link" value={form.map_location} onChange={value => update('map_location',value)} type="url" wide /><Field label="Office hours" value={form.office_hours} onChange={value => update('office_hours',value)} wide /></div>}
      {activeTab === 'advanced' && <div className="grid gap-3 sm:grid-cols-2"><Field label="Website slug" value={form.slug} onChange={value => update('slug',value)} prefix="nepsom.xyz/s/" required wide /><Field label="Facebook URL" value={form.facebook} onChange={value => update('facebook',value)} type="url" /><Field label="Instagram URL" value={form.instagram} onChange={value => update('instagram',value)} type="url" /><Field label="YouTube URL" value={form.youtube} onChange={value => update('youtube',value)} type="url" /><p className="sm:col-span-2 text-xs text-slate-500">SEO title and description use your school name and short description on the current public website.</p></div>}
      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800"><button type="button" onClick={previewWebsite} disabled={!previewHref} className="flex-1 rounded-lg border border-slate-200 p-2 text-xs font-semibold dark:border-slate-700">Preview website</button><button type="button" onClick={() => void publishWebsite()} disabled={!dirty || saving || uploadingLogo || uploadingPrincipalPhoto || uploadingGallery} className="flex-1 rounded-lg bg-blue-600 p-2 text-xs font-bold text-white disabled:opacity-50">{saving?'Saving…':'Save website'}</button></div>
    </section></div>}
  </div></main></div></div>;
}

function EditorGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><div className="mb-4"><h3 className="font-bold text-slate-950 dark:text-white">{title}</h3><p className="mt-1 text-sm text-gray-500">{description}</p></div>{children}</div>; }
function Field({ label, value, onChange, type = 'text', wide = false, required = false, prefix }: { label: string; value: string; onChange: (value: string) => void; type?: string; wide?: boolean; required?: boolean; prefix?: string }) { return <label className={wide ? 'sm:col-span-2' : ''}><span className={labelClass}>{label}{required && <span className="text-red-500"> *</span>}</span>{prefix ? <div className="mt-1.5 flex overflow-hidden rounded-lg border border-slate-200 focus-within:border-blue-500 dark:border-slate-700 focus-within:ring-4 focus-within:ring-blue-500/10"><span className="flex items-center bg-slate-50 px-3 text-xs text-slate-500 dark:bg-slate-800">{prefix}</span><input className="min-w-0 flex-1 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:bg-slate-800 dark:text-white" value={value} onChange={(e) => onChange(e.target.value)} required={required} /></div> : <input className={inputClass} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />}</label>; }
function TextArea({ label, value, onChange, rows, wide = false }: { label: string; value: string; onChange: (value: string) => void; rows: number; wide?: boolean }) { return <label className={wide ? 'sm:col-span-2' : ''}><span className={labelClass}>{label}</span><textarea className={`${inputClass} resize-y`} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }

function normalizeExperience(value: unknown): ExperienceItem[] {
  const rows = Array.isArray(value) ? value : [];
  return Array.from({length:4},(_,index) => { const row = rows[index] as Record<string,unknown> | undefined; return {title:typeof row?.title==='string'?row.title:'',desc:typeof row?.desc==='string'?row.desc:typeof row?.description==='string'?row.description:''}; });
}
function normalizeAchievements(value: unknown): AchievementStat[] {
  const rows = Array.isArray(value) ? value : [];
  return Array.from({length:4},(_,index) => { const row = rows[index] as Record<string,unknown> | undefined; return {label:typeof row?.label==='string'?row.label:'',value:typeof row?.value==='string'?row.value:''}; });
}
