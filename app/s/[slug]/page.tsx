'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { supabase } from '@/lib/supabase';
import { AlertCircle, ArrowRight, Award, BookOpen, Building2, CalendarDays, CheckCircle2, Clock3, Globe, GraduationCap, Image as ImageIcon, Loader2, Mail, MapPin, Menu, Phone, Quote, UserRound, UsersRound, X } from 'lucide-react';

type School = Record<string, any>;
type NewsItem = { id: string; title: string; content: string | null; event_date: string | null; category: string | null; location: string | null; is_event: boolean | null };
type Notice = { id: string; title: string; content: string | null; publish_date: string | null; priority: string | null };
type AwardItem = { id: string; title: string; year: string | null; description: string | null };
type Testimonial = { id: string; name: string; role: string | null; content: string | null };
type GalleryImage = { id: string; image_url: string; label: string | null };

const DEFAULT_SCHOOL_MOTTO = 'Learning today. Leading tomorrow.';
const DEFAULT_SCHOOL_DESCRIPTION = 'A welcoming school community dedicated to quality education, strong values, and the confidence every student needs to succeed.';
const DEFAULT_ABOUT_TEXT = 'Our school is a caring and inclusive learning community where every child is encouraged to grow academically, socially and personally. We work closely with families to provide meaningful learning experiences, strong values and opportunities that prepare students for a successful future.';
const DEFAULT_MISSION = 'To provide a safe, supportive and engaging learning environment that develops knowledge, confidence, creativity and good character in every student.';
const DEFAULT_VISION = 'To become a trusted centre of learning where students are inspired to achieve their potential and grow into responsible, capable and compassionate citizens.';
const DEFAULT_FACILITIES = 'Bright classrooms, a well-stocked library, science and computer learning spaces, safe play areas and supportive resources designed for effective learning.';
const DEFAULT_ACTIVITIES = 'Sports, arts, cultural programmes, clubs, educational visits and community activities that help students discover talents, build teamwork and develop leadership skills.';
const DEFAULT_PRINCIPAL_MESSAGE = 'Welcome to our school. We are committed to creating a safe, inspiring and inclusive learning environment where every student can discover their strengths, build strong character and prepare confidently for the future.';

const themes: Record<string, { solid: string; hover: string; soft: string; text: string; border: string }> = {
  blue: { solid: 'bg-blue-600', hover: 'hover:bg-blue-700', soft: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  emerald: { solid: 'bg-emerald-600', hover: 'hover:bg-emerald-700', soft: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  purple: { solid: 'bg-purple-600', hover: 'hover:bg-purple-700', soft: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  red: { solid: 'bg-red-600', hover: 'hover:bg-red-700', soft: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  amber: { solid: 'bg-amber-600', hover: 'hover:bg-amber-700', soft: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  teal: { solid: 'bg-teal-600', hover: 'hover:bg-teal-700', soft: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
};

export default function PublicSchoolPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [school, setSchool] = useState<School | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const { data: schoolRow, error: schoolError } = await supabase.from('schools').select('*').eq('slug', slug).maybeSingle();
        if (schoolError) throw schoolError;
        if (!schoolRow) throw new Error('We could not find a school website with this address, or it is still awaiting approval.');
        const schoolId = schoolRow.id;
        const [newsResult, noticesResult, awardsResult, testimonialsResult, galleryResult] = await Promise.all([
          supabase.from('news_events').select('id,title,content,event_date,category,location,is_event').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(6),
          supabase.from('notices').select('id,title,content,publish_date,priority').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(5),
          supabase.from('awards').select('id,title,year,description').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(6),
          supabase.from('testimonials').select('id,name,role,content').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(6),
          supabase.from('gallery_images').select('id,image_url,label').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(8),
        ]);
        const firstError = [newsResult.error, noticesResult.error, awardsResult.error, testimonialsResult.error, galleryResult.error].find(Boolean);
        if (firstError) throw firstError;
        let websiteData = schoolRow;
        const previewRequested = new URLSearchParams(window.location.search).get('preview') === '1';
        if (previewRequested) {
          const savedDraft = window.localStorage.getItem(`nepsom-website-draft:${schoolRow.slug}`);
          if (savedDraft) {
            try {
              const parsed = JSON.parse(savedDraft) as { form?: Record<string, unknown> };
              if (parsed.form) {
                const draft = parsed.form;
                websiteData = {
                  ...schoolRow,
                  ...draft,
                  theme_color: `${String(draft.theme_color || 'blue')}:${String(draft.website_template || 'modern')}`,
                };
              }
            } catch {
              // Keep the published version if a browser draft is damaged.
            }
          }
        }
        if (!cancelled) { setSchool(websiteData); setNews(newsResult.data ?? []); setNotices(noticesResult.data ?? []); setAwards(awardsResult.data ?? []); setTestimonials(testimonialsResult.data ?? []); setGallery(galleryResult.data ?? []); }
      } catch (reason) { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load this school website.'); }
      finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [slug]);

  const [themeName, templateName] = String(school?.theme_color || 'blue:modern').split(':');
  const theme = themes[themeName] ?? themes.blue;
  const template = templateName === 'classic' || templateName === 'bold' ? templateName : 'modern';
  const isDraftPreview = typeof window !== 'undefined'
    && Boolean(school?.slug)
    && new URLSearchParams(window.location.search).get('preview') === '1'
    && Boolean(window.localStorage.getItem(`nepsom-website-draft:${school?.slug}`));
  const pageStyle = template === 'classic' ? 'font-serif' : template === 'bold' ? 'bg-slate-950' : 'bg-white';
  const sectionRadius = template === 'classic' ? 'rounded-none' : template === 'bold' ? 'rounded-[2rem]' : 'rounded-[32px]';
  const programs = useMemo(() => Array.isArray(school?.programs) ? school.programs : [], [school]);
  const whyChooseUs = useMemo(() => Array.isArray(school?.why_choose_us) ? school.why_choose_us : [], [school]);
  const heroMotto = school?.motto?.trim() || DEFAULT_SCHOOL_MOTTO;
  const heroDescription = school?.short_description?.trim() || DEFAULT_SCHOOL_DESCRIPTION;
  const { typedText, typingComplete } = useTypingText(heroMotto);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /><span className="ml-3 font-medium text-gray-600">Loading school website…</span></div>;
  if (error || !school) return <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4"><div className="max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm"><AlertCircle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-bold text-gray-950">School website unavailable</h1><p className="mt-2 text-sm leading-6 text-gray-600">{error}</p><Link href="/schools" className="mt-6 inline-flex rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white">Browse schools</Link></div></div>;

  const nav = [
    { label: 'About', href: '#about', icon: Building2 },
    { label: 'Programs', href: '#programs', icon: BookOpen },
    { label: 'Teachers', href: '#teachers', icon: UsersRound },
    { label: 'Updates', href: '#updates', icon: CalendarDays },
    { label: 'Gallery', href: '#gallery', icon: ImageIcon },
    { label: 'Contact', href: '#contact', icon: Mail },
  ];
  return <div className={`min-h-screen text-gray-900 ${pageStyle}`}>
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:h-[72px] sm:px-6 lg:grid lg:grid-cols-[minmax(220px,1fr)_auto_minmax(220px,1fr)] lg:gap-5 lg:px-8">
        {/* Brand */}
        <Link href="#" className="group flex min-w-0 shrink-0 items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-0.5 shadow-sm transition duration-200 group-hover:scale-[1.03] sm:h-12 sm:w-12 ${theme.solid}`}>
            <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-[10px] bg-white p-1">
              {school.logo_url ? (
                <NextImage
                  src={school.logo_url}
                  alt={`${school.name} logo`}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <span className={`flex h-full w-full items-center justify-center rounded-lg text-white ${theme.solid}`}>
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
              )}
            </span>
          </span>

          <span className="min-w-0">
            <span className="block max-w-[190px] truncate text-sm font-extrabold leading-tight tracking-tight text-gray-950 transition group-hover:text-blue-700 sm:max-w-[260px] sm:text-base lg:max-w-[240px]">
              {school.name}
            </span>
            <span className="mt-1 hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 sm:block">
              {school.school_level || school.school_type || 'Official school website'}
            </span>
          </span>
        </Link>

        {/* Section links */}
        <nav className="hidden items-center justify-self-center rounded-xl border border-gray-200 bg-gray-50/80 p-1 lg:flex" aria-label="School website sections">
          {nav.map(({ label, href, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="group/link relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition duration-200 hover:bg-white hover:text-blue-700 hover:shadow-sm"
            >
              <Icon className="h-4 w-4 shrink-0 transition duration-200 group-hover/link:scale-110" strokeWidth={2} />
              {label}
              <span className="absolute inset-x-3 -bottom-1 h-0.5 origin-center scale-x-0 rounded-full bg-blue-600 transition-transform duration-200 group-hover/link:scale-x-100" aria-hidden="true" />
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden shrink-0 items-center justify-self-end gap-2 lg:flex">
          <Link
            href={`/s/${school.slug}/admission`}
            className={`group inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 ${theme.solid} ${theme.hover}`}
          >
            Apply now
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={`/s/${school.slug}/login`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 transition hover:border-gray-400 hover:bg-gray-50"
          >
            Login
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="ml-auto rounded-lg border border-gray-200 bg-white p-2.5 text-gray-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="relative border-t border-blue-100/80 bg-white/95 px-4 pb-5 pt-3 shadow-xl backdrop-blur-xl lg:hidden">
          <nav className="mx-auto max-w-7xl" aria-label="Mobile school website sections">
            {nav.map(({ label, href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:pl-4 hover:text-blue-700"
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-gray-100 pt-4">
              <Link
                href={`/s/${school.slug}/admission`}
                onClick={() => setMenuOpen(false)}
                className={`rounded-xl px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition ${theme.solid} ${theme.hover}`}
              >
                Apply now
              </Link>
              <Link
                href={`/s/${school.slug}/login`}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-gray-950 px-4 py-3 text-center text-sm font-bold text-white shadow-md transition hover:bg-gray-800"
              >
                Login
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>

    <main>
      {isDraftPreview && (
        <div className="sticky top-[72px] z-30 border-b border-amber-300 bg-amber-100 px-4 py-3 text-center text-sm font-bold text-amber-950 sm:top-20">
          Draft preview — only you can see these unpublished changes.
        </div>
      )}
      {!isDraftPreview && school.is_approved === false && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900">
          Preview mode — your website is visible to you while the school is awaiting approval.
        </div>
      )}
      <section className={`school-pattern-grid relative isolate overflow-hidden bg-white text-gray-950 ${template === 'classic' ? 'border-b-8 border-amber-500' : ''}`}>

        <div className={`relative z-10 mx-auto grid max-w-[1600px] items-center gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.65fr)] lg:px-10 xl:px-12 2xl:px-16 ${template === 'bold' ? 'min-h-[760px] py-24 sm:py-32' : 'min-h-[640px] py-16 sm:py-20'}`}>
          <div className="max-w-4xl">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest ${theme.border} ${theme.soft} ${theme.text}`}>
              <Building2 className="h-3.5 w-3.5" />
              {school.school_type || 'Welcome to our school'}
            </span>

            <h1 className={`mt-6 max-w-4xl leading-[1.05] text-gray-950 ${template === 'classic' ? 'text-4xl font-bold sm:text-5xl lg:text-6xl' : template === 'bold' ? 'text-5xl font-black uppercase tracking-tight sm:text-6xl lg:text-8xl' : 'text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl'}`}>
              {school.name}
            </h1>

            <p className={`mt-5 min-h-8 max-w-3xl text-lg font-semibold leading-8 sm:text-xl ${theme.text}`} aria-label={heroMotto}>
              <span aria-hidden="true">“{typedText}</span>
              <span
                aria-hidden="true"
                className={`ml-0.5 inline-block h-6 w-0.5 translate-y-1 rounded-full bg-blue-600 ${typingComplete ? 'animate-pulse' : ''}`}
              />
              <span aria-hidden="true">”</span>
            </p>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              {heroDescription}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/s/${school.slug}/admission`}
                className={`group inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 ${theme.solid} ${theme.hover}`}
              >
                Apply for admission
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#contact"
                className="rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-bold text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                Contact school
              </a>
            </div>
          </div>

          <aside className={`relative hidden min-h-[430px] overflow-hidden border border-gray-200 bg-white/95 p-7 shadow-xl shadow-gray-200/70 lg:flex lg:flex-col xl:p-8 ${sectionRadius}`}>
            <div className="relative flex items-center justify-between">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${theme.border} ${theme.soft} ${theme.text}`}>
                <Quote className="h-3.5 w-3.5" />
                From the principal
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
            </div>

            <div className="relative mt-6 flex items-center gap-4">
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white shadow-sm ${theme.border}`}>
                {school.principal_image_url ? (
                  <NextImage src={school.principal_image_url} alt={`${school.principal || 'School principal'} portrait`} width={80} height={80} unoptimized className="h-full w-full rounded-full object-cover" />
                ) : (
                  <UserRound className={`h-9 w-9 ${theme.text}`} strokeWidth={1.8} />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold text-gray-950">{school.principal || 'School Principal'}</p>
                <p className="mt-1 text-sm font-medium text-gray-500">Principal · {school.name}</p>
              </div>
            </div>

            <div className={`relative mt-6 flex-1 border-l-2 pl-5 ${theme.border}`}>
              <p className="whitespace-pre-line text-[15px] leading-7 text-gray-600">{school.principal_message?.trim() || DEFAULT_PRINCIPAL_MESSAGE}</p>
            </div>

            {(school.address || school.established_year) && (
              <div className="relative mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-200 pt-5 text-xs font-semibold text-gray-500">
                {school.address && <span className="flex items-center gap-2"><MapPin className={`h-4 w-4 ${theme.text}`} /><span className="line-clamp-1">{school.address}</span></span>}
                {school.established_year && <span className="flex items-center gap-2"><CalendarDays className={`h-4 w-4 ${theme.text}`} />Since {school.established_year} B.S.</span>}
              </div>
            )}
          </aside>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 py-16 sm:py-24"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><Eyebrow text="About our school" color={theme.text} /><h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">Learning, character and opportunity</h2><p className="mt-5 whitespace-pre-line text-base leading-8 text-gray-600">{school.about_text?.trim() || DEFAULT_ABOUT_TEXT}</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><InfoCard title="Our mission" text={school.mission?.trim() || DEFAULT_MISSION} icon={<BookOpen className="h-5 w-5" />} theme={theme} /><InfoCard title="Our vision" text={school.vision?.trim() || DEFAULT_VISION} icon={<GraduationCap className="h-5 w-5" />} theme={theme} /></div></div></section>

      <section id="programs" className="scroll-mt-24 bg-gray-50 py-16 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="max-w-2xl"><Eyebrow text="School experience" color={theme.text} /><h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">What students can expect</h2></div><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{programs.map((item: any, index: number) => <InfoCard key={`${item.title}-${index}`} title={item.title || 'Academic program'} text={item.desc || item.description || ''} icon={<BookOpen className="h-5 w-5" />} theme={theme} />)}{whyChooseUs.map((item: any, index: number) => <InfoCard key={`${item.title}-${index}`} title={item.title || 'Why choose us'} text={item.desc || item.description || ''} icon={<CheckCircle2 className="h-5 w-5" />} theme={theme} />)}<InfoCard title="Facilities" text={school.facilities?.trim() || DEFAULT_FACILITIES} icon={<Building2 className="h-5 w-5" />} theme={theme} /><InfoCard title="Activities" text={school.activities?.trim() || DEFAULT_ACTIVITIES} icon={<GraduationCap className="h-5 w-5" />} theme={theme} /></div></div></section>

      {(news.length > 0 || notices.length > 0) && <section id="updates" className="scroll-mt-24 py-16 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><Eyebrow text="Latest updates" color={theme.text} /><h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">News, events and notices</h2><div className="mt-10 grid gap-8 lg:grid-cols-2"><div className="space-y-4">{news.map((item) => <article key={item.id} className="rounded-2xl border border-gray-200 p-5"><div className="flex items-center gap-2 text-xs font-semibold text-gray-500"><CalendarDays className="h-4 w-4" />{formatDate(item.event_date)}{item.category && <span>• {item.category}</span>}</div><h3 className="mt-2 font-bold text-gray-950">{item.title}</h3>{item.content && <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{item.content}</p>}</article>)}</div><div className="space-y-4">{notices.map((item) => <article key={item.id} className={`rounded-2xl border p-5 ${theme.border} ${theme.soft}`}><p className={`text-xs font-bold uppercase ${theme.text}`}>{item.priority || 'Notice'} · {formatDate(item.publish_date)}</p><h3 className="mt-2 font-bold text-gray-950">{item.title}</h3>{item.content && <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{item.content}</p>}</article>)}</div></div></div></section>}

      {gallery.length > 0 && <section id="gallery" className="scroll-mt-24 bg-gray-50 py-16 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><Eyebrow text="Gallery" color={theme.text} /><h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">Life at {school.name}</h2><div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">{gallery.map((image) => <figure key={image.id} className="overflow-hidden rounded-2xl bg-gray-200"><img src={image.image_url} alt={image.label || 'School gallery'} className="aspect-square h-full w-full object-cover transition hover:scale-105" /></figure>)}</div></div></section>}

      {(awards.length > 0 || testimonials.length > 0) && <section className="py-16 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid gap-10 lg:grid-cols-2">{awards.length > 0 && <div><h2 className="flex items-center gap-3 text-2xl font-bold"><Award className={theme.text} /> Achievements</h2><div className="mt-6 space-y-3">{awards.map((item) => <div key={item.id} className="rounded-2xl border border-gray-200 p-5"><p className="font-bold text-gray-950">{item.title}</p><p className="mt-1 text-sm text-gray-500">{item.year}</p>{item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}</div>)}</div></div>}{testimonials.length > 0 && <div><h2 className="flex items-center gap-3 text-2xl font-bold"><Quote className={theme.text} /> Community voices</h2><div className="mt-6 space-y-3">{testimonials.map((item) => <blockquote key={item.id} className={`rounded-2xl border p-5 ${theme.border} ${theme.soft}`}><p className="text-sm leading-6 text-gray-700">“{item.content}”</p><footer className="mt-3 text-sm font-bold text-gray-950">{item.name}<span className="ml-2 font-normal text-gray-500">{item.role}</span></footer></blockquote>)}</div></div>}</div></div></section>}

      <section id="contact" className="scroll-mt-24 bg-gray-950 py-16 text-white"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid gap-10 lg:grid-cols-[1fr_auto]"><div><p className="text-sm font-bold uppercase tracking-widest text-gray-400">Contact us</p><h2 className="mt-3 text-3xl font-bold">Visit or contact {school.name}</h2><div className="mt-7 grid gap-4 text-sm text-gray-300 sm:grid-cols-2">{school.address && <Contact icon={<MapPin />} text={school.address} />}{school.phone && <Contact icon={<Phone />} text={school.phone} href={`tel:${school.phone}`} />}{school.email && <Contact icon={<Mail />} text={school.email} href={`mailto:${school.email}`} />}{school.office_hours && <Contact icon={<Clock3 />} text={school.office_hours} />}</div><div className="mt-7 flex gap-3">{school.facebook && <Social href={school.facebook} label="Facebook"><Globe /></Social>}{school.instagram && <Social href={school.instagram} label="Instagram"><Globe /></Social>}{school.youtube && <Social href={school.youtube} label="YouTube"><Globe /></Social>}</div></div><Link href={`/s/${school.slug}/admission`} className={`inline-flex h-fit items-center justify-center gap-2 self-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white ${theme.solid} ${theme.hover}`}>Apply for admission <ArrowRight className="h-4 w-4" /></Link></div></div></section>
    </main>
    <footer className="border-t border-gray-800 bg-gray-950 py-6 text-center text-xs text-gray-500">© {new Date().getFullYear()} {school.name}. Powered by NEPSOM.</footer>
  </div>;
}

function Eyebrow({ text, color }: { text: string; color: string }) { return <p className={`text-sm font-bold uppercase tracking-widest ${color}`}>{text}</p>; }
function InfoCard({ title, text, icon, theme }: { title: string; text: string; icon: React.ReactNode; theme: (typeof themes)[string] }) { return <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.soft} ${theme.text}`}>{icon}</div><h3 className="mt-4 font-bold text-gray-950">{title}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">{text}</p></article>; }
function Contact({ icon, text, href }: { icon: React.ReactNode; text: string; href?: string }) { const content = <><span className="mt-0.5 [&>svg]:h-4 [&>svg]:w-4">{icon}</span><span className="whitespace-pre-line">{text}</span></>; return href ? <a href={href} className="flex items-start gap-3 hover:text-white">{content}</a> : <div className="flex items-start gap-3">{content}</div>; }
function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) { return <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-lg bg-white/10 p-2.5 text-gray-300 hover:bg-white/15 hover:text-white [&>svg]:h-4 [&>svg]:w-4">{children}</a>; }
function formatDate(value: string | null) { if (!value) return 'Recent'; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-NP', { day: 'numeric', month: 'short', year: 'numeric' }).format(date); }


function useTypingText(text: string, speed = 42) {
  const [typedText, setTypedText] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedText(text);
      setTypingComplete(true);
      return;
    }

    let characterIndex = 0;
    setTypedText('');
    setTypingComplete(false);

    const timer = window.setInterval(() => {
      characterIndex += 1;
      setTypedText(text.slice(0, characterIndex));

      if (characterIndex >= text.length) {
        window.clearInterval(timer);
        setTypingComplete(true);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  return { typedText, typingComplete };
}
