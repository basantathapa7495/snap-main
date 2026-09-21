'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { supabase } from '@/lib/supabase';
import { AlertCircle, ArrowRight, Award, BookOpen, Building2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Globe, GraduationCap, Image as ImageIcon, Lightbulb, Loader2, Mail, MapPin, Menu, Phone, Quote, ShieldCheck, Sparkles, UserRound, UsersRound, X } from 'lucide-react';

type School = {
  id: string;
  name: string;
  slug: string;
  school_type: string | null;
  school_level: string | null;
  established_year: number | null;
  principal: string | null;
  motto: string | null;
  short_description: string | null;
  about_text: string | null;
  principal_message: string | null;
  principal_image_url: string | null;
  mission: string | null;
  vision: string | null;
  theme_color: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  office_hours: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  facilities: string | null;
  activities: string | null;
  why_choose_us: unknown;
  achievement_stats: unknown;
  is_approved: boolean;
};
type NewsItem = { id: string; title: string; content: string | null; event_date: string | null; category: string | null; location: string | null; is_event: boolean | null };
type Notice = { id: string; title: string; content: string | null; publish_date: string | null; priority: string | null };
type AwardItem = { id: string; title: string; year: string | null; description: string | null };
type Testimonial = { id: string; name: string; role: string | null; content: string | null };
type GalleryImage = { id: string; image_url: string; label: string | null };
type ExperienceItem = { title: string; desc: string };
type AchievementStat = { label: string; value: string };

const DEFAULT_SCHOOL_MOTTO = 'Learning today. Leading tomorrow.';
const DEFAULT_SCHOOL_DESCRIPTION = 'A welcoming school community dedicated to quality education, strong values, and the confidence every student needs to succeed.';
const DEFAULT_ABOUT_TEXT = 'Our school is a caring and inclusive learning community where every child is encouraged to grow academically, socially and personally. We work closely with families to provide meaningful learning experiences, strong values and opportunities that prepare students for a successful future.';
const DEFAULT_MISSION = 'To provide a safe, supportive and engaging learning environment that develops knowledge, confidence, creativity and good character in every student.';
const DEFAULT_VISION = 'To become a trusted centre of learning where students are inspired to achieve their potential and grow into responsible, capable and compassionate citizens.';
const DEFAULT_FACILITIES = 'Bright classrooms, a well-stocked library, science and computer learning spaces, safe play areas and supportive resources designed for effective learning.';
const DEFAULT_ACTIVITIES = 'Sports, arts, cultural programmes, clubs, educational visits and community activities that help students discover talents, build teamwork and develop leadership skills.';
const DEFAULT_PRINCIPAL_MESSAGE = 'Welcome to our school. We are committed to creating a safe, inspiring and inclusive learning environment where every student can discover their strengths, build strong character and prepare confidently for the future.';
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
const EXPERIENCE_ICONS = [BookOpen, Award, Lightbulb, ShieldCheck];
const ACHIEVEMENT_ICONS = [GraduationCap, UsersRound, Award, CalendarDays];

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
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

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
        if (!cancelled) { setSchool(schoolRow); setNews(newsResult.data ?? []); setNotices(noticesResult.data ?? []); setAwards(awardsResult.data ?? []); setTestimonials(testimonialsResult.data ?? []); setGallery(galleryResult.data ?? []); }
      } catch (reason) { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load this school website.'); }
      finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [slug]);

  const [themeName, templateName] = String(school?.theme_color || 'blue:modern').split(':');
  const theme = themes[themeName] ?? themes.blue;
  const template = templateName === 'classic' || templateName === 'bold' ? templateName : 'modern';
  const pageStyle = template === 'classic' ? 'font-serif' : template === 'bold' ? 'bg-slate-950' : 'bg-white';
  const sectionRadius = template === 'classic' ? 'rounded-none' : template === 'bold' ? 'rounded-[2rem]' : 'rounded-[32px]';
  const whyChooseUs = useMemo(() => normalizeExperience(school?.why_choose_us), [school]);
  const achievementStats = useMemo(() => normalizeAchievements(school?.achievement_stats), [school]);
  const heroGallery = useMemo(() => gallery.slice(0, 5), [gallery]);
  const heroMotto = school?.motto?.trim() || DEFAULT_SCHOOL_MOTTO;
  const heroDescription = school?.short_description?.trim() || DEFAULT_SCHOOL_DESCRIPTION;
  const { typedText, typingComplete } = useTypingText(heroMotto);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => setActiveHeroSlide(0), 0);
    if (heroGallery.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => window.clearTimeout(resetTimer);
    const timer = window.setInterval(() => setActiveHeroSlide((current) => (current + 1) % heroGallery.length), 5000);
    return () => { window.clearTimeout(resetTimer); window.clearInterval(timer); };
  }, [heroGallery.length]);

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
      {school.is_approved === false && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900">
          Preview mode — your website is visible to you while the school is awaiting approval.
        </div>
      )}
      <section className={`school-pattern-grid relative isolate overflow-hidden bg-white text-gray-950 ${template === 'classic' ? 'border-b-8 border-amber-500' : ''}`}>

        <div className={`relative z-10 mx-auto grid max-w-[1400px] items-center gap-8 px-5 py-12 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.72fr)] lg:px-10 xl:px-12 ${template === 'bold' ? 'min-h-[620px] lg:py-16' : 'min-h-[520px] lg:py-14'}`}>
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
            {(school.address || school.established_year || school.school_level) && <div className="mt-7 flex flex-wrap gap-2.5 text-sm font-semibold text-gray-600">
              {school.school_level && <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"><GraduationCap className={`h-4 w-4 ${theme.text}`} />{school.school_level}</span>}
              {school.established_year && <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"><CalendarDays className={`h-4 w-4 ${theme.text}`} />Established {school.established_year} B.S.</span>}
              {school.address && <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"><MapPin className={`h-4 w-4 ${theme.text}`} /><span className="max-w-56 truncate">{school.address}</span></span>}
            </div>}
          </div>

          <aside className={`relative overflow-hidden border-2 border-blue-100 bg-white p-1 shadow-xl shadow-gray-200/70 ring-4 ring-blue-50/70 ${sectionRadius}`}>
            {heroGallery.length > 0 ? (
              <div className="relative aspect-[4/3] min-h-[260px]">
                <NextImage
                  key={heroGallery[activeHeroSlide].id}
                  src={heroGallery[activeHeroSlide].image_url}
                  alt={heroGallery[activeHeroSlide].label || `${school.name} school life`}
                  fill
                  priority
                  unoptimized
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-5 pb-5 pt-14 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/75">Life at {school.name}</p>
                  <p className="mt-1 text-sm font-semibold">{heroGallery[activeHeroSlide].label || 'Learning, growing and achieving together'}</p>
                </div>
                {heroGallery.length > 1 && <>
                  <button type="button" onClick={() => setActiveHeroSlide((current) => (current - 1 + heroGallery.length) % heroGallery.length)} aria-label="Show previous school photo" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 shadow-sm transition hover:bg-white"><ChevronLeft className="h-5 w-5" /></button>
                  <button type="button" onClick={() => setActiveHeroSlide((current) => (current + 1) % heroGallery.length)} aria-label="Show next school photo" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 shadow-sm transition hover:bg-white"><ChevronRight className="h-5 w-5" /></button>
                  <div className="absolute bottom-4 right-4 flex gap-1.5" aria-label={`Photo ${activeHeroSlide + 1} of ${heroGallery.length}`}>{heroGallery.map((image, index) => <button key={image.id} type="button" onClick={() => setActiveHeroSlide(index)} aria-label={`Show school photo ${index + 1}`} className={`h-2 rounded-full transition ${index === activeHeroSlide ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/90'}`} />)}</div>
                </>}
              </div>
            ) : (
              <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.soft} ${theme.text}`}><ImageIcon className="h-6 w-6" /></span>
                <h2 className="mt-4 text-lg font-bold text-gray-950">School photos</h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">Add one to five photos in the school gallery to show your campus, students and activities here.</p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 border-t border-gray-100 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(330px,0.92fr)] lg:items-stretch">
            <div className={`rounded-3xl border p-6 sm:p-8 ${theme.border} ${theme.soft}`}>
              <Eyebrow text="About our school" color={theme.text} />
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">Learning, character and opportunity</h2>
              <p className="mt-4 text-lg font-semibold leading-8 text-gray-800">
                {school.name} has been providing quality education{school.established_year ? ` since ${school.established_year} B.S.` : ''}.
              </p>
              <p className="mt-3 whitespace-pre-line text-base leading-7 text-gray-600">{school.about_text?.trim() || DEFAULT_ABOUT_TEXT}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoCard title="Our mission" text={school.mission?.trim() || DEFAULT_MISSION} icon={<BookOpen className="h-5 w-5" />} theme={theme} compact />
                <InfoCard title="Our vision" text={school.vision?.trim() || DEFAULT_VISION} icon={<GraduationCap className="h-5 w-5" />} theme={theme} compact />
              </div>
            </div>

            <article className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gray-950 p-6 text-white shadow-xl sm:p-8">
              <Quote className="absolute right-6 top-6 h-16 w-16 text-white/5" aria-hidden="true" />
              <div className="relative flex items-center gap-4">
                <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white/15 bg-white/10 ${theme.border}`}>
                  {school.principal_image_url ? <NextImage src={school.principal_image_url} alt={`${school.principal || 'School principal'} portrait`} width={80} height={80} unoptimized className="h-full w-full object-cover" /> : <UserRound className="h-9 w-9 text-white/70" strokeWidth={1.7} />}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.17em] text-blue-300">Message from the principal</p>
                  <h3 className="mt-1 text-xl font-bold">{school.principal || 'School Principal'}</h3>
                  <p className="mt-0.5 text-sm text-gray-400">Principal, {school.name}</p>
                </div>
              </div>
              <blockquote className="relative mt-6 border-l-2 border-blue-400 pl-4 text-base leading-7 text-gray-200">“{school.principal_message?.trim() || DEFAULT_PRINCIPAL_MESSAGE}”</blockquote>
              <div className="relative mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400"><Sparkles className="h-4 w-4 text-blue-300" /> Leading with purpose</div>
            </article>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {achievementStats.map((stat, index) => {
              const Icon = ACHIEVEMENT_ICONS[index] || Award;
              return <article key={`${stat.label}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.soft} ${theme.text}`}><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-xl font-extrabold tracking-tight text-gray-950 sm:text-2xl">{stat.value}</p><p className="mt-0.5 text-xs font-semibold leading-5 text-gray-500 sm:text-sm">{stat.label}</p></div></div></article>;
            })}
          </div>

          <div id="programs" className="scroll-mt-24 pt-12 sm:pt-14">
            <div className="max-w-2xl">
              <Eyebrow text="School experience" color={theme.text} />
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">What students can expect</h2>
              <p className="mt-3 text-base leading-7 text-gray-600">A complete school experience designed for strong learning, confidence and personal growth.</p>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {whyChooseUs.map((item, index) => {
                const Icon = EXPERIENCE_ICONS[index] || CheckCircle2;
                return <InfoCard key={`${item.title}-${index}`} title={item.title} text={item.desc} icon={<Icon className="h-5 w-5" />} theme={theme} compact />;
              })}
              <InfoCard title="Facilities" text={school.facilities?.trim() || DEFAULT_FACILITIES} icon={<Building2 className="h-5 w-5" />} theme={theme} compact />
              <InfoCard title="Activities" text={school.activities?.trim() || DEFAULT_ACTIVITIES} icon={<GraduationCap className="h-5 w-5" />} theme={theme} compact />
            </div>
          </div>
        </div>
      </section>

      {(news.length > 0 || notices.length > 0) && <section id="updates" className="scroll-mt-24 py-16 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><Eyebrow text="Latest updates" color={theme.text} /><h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">News, events and notices</h2><div className="mt-10 grid gap-8 lg:grid-cols-2"><div className="space-y-4">{news.map((item) => <article key={item.id} className="rounded-2xl border border-gray-200 p-5"><div className="flex items-center gap-2 text-xs font-semibold text-gray-500"><CalendarDays className="h-4 w-4" />{formatDate(item.event_date)}{item.category && <span>• {item.category}</span>}</div><h3 className="mt-2 font-bold text-gray-950">{item.title}</h3>{item.content && <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{item.content}</p>}</article>)}</div><div className="space-y-4">{notices.map((item) => <article key={item.id} className={`rounded-2xl border p-5 ${theme.border} ${theme.soft}`}><p className={`text-xs font-bold uppercase ${theme.text}`}>{item.priority || 'Notice'} · {formatDate(item.publish_date)}</p><h3 className="mt-2 font-bold text-gray-950">{item.title}</h3>{item.content && <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{item.content}</p>}</article>)}</div></div></div></section>}

      {gallery.length > 0 && <section id="gallery" className="scroll-mt-24 bg-gray-50 py-16 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><Eyebrow text="Gallery" color={theme.text} /><h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">Life at {school.name}</h2><div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">{gallery.map((image) => <figure key={image.id} className="overflow-hidden rounded-2xl bg-gray-200"><NextImage src={image.image_url} alt={image.label || 'School gallery'} width={600} height={600} unoptimized className="aspect-square h-full w-full object-cover transition hover:scale-105" /></figure>)}</div></div></section>}

      {(awards.length > 0 || testimonials.length > 0) && <section className="py-16 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid gap-10 lg:grid-cols-2">{awards.length > 0 && <div><h2 className="flex items-center gap-3 text-2xl font-bold"><Award className={theme.text} /> Achievements</h2><div className="mt-6 space-y-3">{awards.map((item) => <div key={item.id} className="rounded-2xl border border-gray-200 p-5"><p className="font-bold text-gray-950">{item.title}</p><p className="mt-1 text-sm text-gray-500">{item.year}</p>{item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}</div>)}</div></div>}{testimonials.length > 0 && <div><h2 className="flex items-center gap-3 text-2xl font-bold"><Quote className={theme.text} /> Community voices</h2><div className="mt-6 space-y-3">{testimonials.map((item) => <blockquote key={item.id} className={`rounded-2xl border p-5 ${theme.border} ${theme.soft}`}><p className="text-sm leading-6 text-gray-700">“{item.content}”</p><footer className="mt-3 text-sm font-bold text-gray-950">{item.name}<span className="ml-2 font-normal text-gray-500">{item.role}</span></footer></blockquote>)}</div></div>}</div></div></section>}

      <section id="contact" className="scroll-mt-24 bg-gray-950 py-16 text-white"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid gap-10 lg:grid-cols-[1fr_auto]"><div><p className="text-sm font-bold uppercase tracking-widest text-gray-400">Contact us</p><h2 className="mt-3 text-3xl font-bold">Visit or contact {school.name}</h2><div className="mt-7 grid gap-4 text-sm text-gray-300 sm:grid-cols-2">{school.address && <Contact icon={<MapPin />} text={school.address} />}{school.phone && <Contact icon={<Phone />} text={school.phone} href={`tel:${school.phone}`} />}{school.email && <Contact icon={<Mail />} text={school.email} href={`mailto:${school.email}`} />}{school.office_hours && <Contact icon={<Clock3 />} text={school.office_hours} />}</div><div className="mt-7 flex gap-3">{school.facebook && <Social href={school.facebook} label="Facebook"><Globe /></Social>}{school.instagram && <Social href={school.instagram} label="Instagram"><Globe /></Social>}{school.youtube && <Social href={school.youtube} label="YouTube"><Globe /></Social>}</div></div><Link href={`/s/${school.slug}/admission`} className={`inline-flex h-fit items-center justify-center gap-2 self-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white ${theme.solid} ${theme.hover}`}>Apply for admission <ArrowRight className="h-4 w-4" /></Link></div></div></section>
    </main>
    <footer className="border-t border-gray-800 bg-gray-950 py-6 text-center text-xs text-gray-500">© {new Date().getFullYear()} {school.name}. Powered by NEPSOM.</footer>
  </div>;
}

function Eyebrow({ text, color }: { text: string; color: string }) { return <p className={`text-sm font-bold uppercase tracking-widest ${color}`}>{text}</p>; }
function InfoCard({ title, text, icon, theme, compact = false }: { title: string; text: string; icon: React.ReactNode; theme: (typeof themes)[string]; compact?: boolean }) { return <article className={`rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md ${compact ? 'p-5' : 'p-6'}`}><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.soft} ${theme.text}`}>{icon}</div><h3 className="mt-3 font-bold text-gray-950">{title}</h3><p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-gray-600">{text}</p></article>; }
function Contact({ icon, text, href }: { icon: React.ReactNode; text: string; href?: string }) { const content = <><span className="mt-0.5 [&>svg]:h-4 [&>svg]:w-4">{icon}</span><span className="whitespace-pre-line">{text}</span></>; return href ? <a href={href} className="flex items-start gap-3 hover:text-white">{content}</a> : <div className="flex items-start gap-3">{content}</div>; }
function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) { return <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-lg bg-white/10 p-2.5 text-gray-300 hover:bg-white/15 hover:text-white [&>svg]:h-4 [&>svg]:w-4">{children}</a>; }
function formatDate(value: string | null) { if (!value) return 'Recent'; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-NP', { day: 'numeric', month: 'short', year: 'numeric' }).format(date); }

function normalizeExperience(value: unknown): ExperienceItem[] {
  if (!Array.isArray(value)) return DEFAULT_EXPERIENCE;
  return DEFAULT_EXPERIENCE.map((fallback, index) => {
    const item = value[index];
    if (!item || typeof item !== 'object') return fallback;
    const record = item as Record<string, unknown>;
    return {
      title: typeof record.title === 'string' && record.title.trim() ? record.title : fallback.title,
      desc: typeof record.desc === 'string' && record.desc.trim() ? record.desc : typeof record.description === 'string' && record.description.trim() ? record.description : fallback.desc,
    };
  });
}

function normalizeAchievements(value: unknown): AchievementStat[] {
  if (!Array.isArray(value)) return DEFAULT_ACHIEVEMENTS;
  return DEFAULT_ACHIEVEMENTS.map((fallback, index) => {
    const item = value[index];
    if (!item || typeof item !== 'object') return fallback;
    const record = item as Record<string, unknown>;
    return {
      label: typeof record.label === 'string' && record.label.trim() ? record.label : fallback.label,
      value: typeof record.value === 'string' && record.value.trim() ? record.value : fallback.value,
    };
  });
}


function useTypingText(text: string, speed = 42) {
  const [typedText, setTypedText] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    let characterIndex = 0;
    let timer: number | undefined;
    const startTimer = window.setTimeout(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setTypedText(text);
        setTypingComplete(true);
        return;
      }

      setTypedText('');
      setTypingComplete(false);
      timer = window.setInterval(() => {
        characterIndex += 1;
        setTypedText(text.slice(0, characterIndex));

        if (characterIndex >= text.length) {
          window.clearInterval(timer);
          setTypingComplete(true);
        }
      }, speed);
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
      if (timer) window.clearInterval(timer);
    };
  }, [text, speed]);

  return { typedText, typingComplete };
}
