'use client';

import { CSSProperties, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight, Award, BookOpen, Building2, CalendarDays, CheckCircle2,
  Clock, ExternalLink, GraduationCap, Image as ImageIcon, Loader2, Mail,
  MapPin, Menu, Newspaper, Phone, Quote, ShieldCheck, Target, Trophy, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Program = { title: string; desc: string };
type Reason = { icon?: string; title: string; desc: string };
type School = {
  id: string;
  name: string | null;
  slug: string | null;
  school_type: string | null;
  school_level: string | null;
  established_year: number | null;
  principal: string | null;
  motto: string | null;
  short_description: string | null;
  principal_message: string | null;
  about_text: string | null;
  mission: string | null;
  vision: string | null;
  logo_url: string | null;
  banner_url: string | null;
  theme_color: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  school_email: string | null;
  phones: unknown;
  emails: unknown;
  office_hours: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  map_location: string | null;
  facilities: string | null;
  activities: string | null;
  programs: unknown;
  why_choose_us: unknown;
  admission_cta_items: unknown;
  show_programs: boolean | null;
  show_news: boolean | null;
  show_notices: boolean | null;
  show_testimonials: boolean | null;
  show_awards: boolean | null;
  show_achievements: boolean | null;
};

type NewsItem = {
  id: string; title: string; content: string | null; event_date: string | null;
  event_time: string | null; location: string | null; is_event: boolean | null;
  category: string | null; is_featured: boolean | null; created_at: string | null;
};
type AwardItem = { id: string; title: string; year: string | null; description: string | null };
type Testimonial = { id: string; name: string; role: string | null; content: string | null };
type GalleryItem = { id: string; image_url: string; label: string | null };

const themeMap: Record<string, { brand: string; dark: string; soft: string }> = {
  blue: { brand: '#2563eb', dark: '#1d4ed8', soft: '#eff6ff' },
  green: { brand: '#16a34a', dark: '#15803d', soft: '#f0fdf4' },
  emerald: { brand: '#059669', dark: '#047857', soft: '#ecfdf5' },
  purple: { brand: '#7c3aed', dark: '#6d28d9', soft: '#f5f3ff' },
  red: { brand: '#dc2626', dark: '#b91c1c', soft: '#fef2f2' },
  orange: { brand: '#ea580c', dark: '#c2410c', soft: '#fff7ed' },
  amber: { brand: '#d97706', dark: '#b45309', soft: '#fffbeb' },
  teal: { brand: '#0d9488', dark: '#0f766e', soft: '#f0fdfa' },
};

const asStrings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];
const asPrograms = (value: unknown): Program[] => Array.isArray(value)
  ? value.map((item) => {
      const row = item as Record<string, unknown>;
      return { title: typeof row?.title === 'string' ? row.title : '', desc: typeof (row?.desc || row?.description) === 'string' ? String(row.desc || row.description) : '' };
    }).filter((item) => item.title || item.desc)
  : [];
const asReasons = (value: unknown): Reason[] => Array.isArray(value)
  ? value.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        icon: typeof row?.icon === 'string' ? row.icon : '✓',
        title: typeof row?.title === 'string' ? row.title : '',
        desc: typeof (row?.desc || row?.description) === 'string' ? String(row.desc || row.description) : '',
      };
    }).filter((item) => item.title || item.desc)
  : [];
const safeUrl = (value: string | null | undefined) => {
  if (!value) return '';
  const candidate = /^https?:\/\//i.test(value) ? value : 'https://' + value;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
};
const displayDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('en-NP', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value + 'T00:00:00'))
  : '';

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-10 text-center">
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--brand)' }}>{eyebrow}</p>
      <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h2>
    </div>
  );
}

export default function SchoolWebsitePage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : Array.isArray(params.slug) ? params.slug[0] : '';
  const [school, setSchool] = useState<School | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const loadSchool = async () => {
      if (!slug) return;
      setLoading(true);
      setNotFound(false);

      const { data, error } = await supabase
        .from('schools')
        .select('id,name,slug,school_type,school_level,established_year,principal,motto,short_description,principal_message,about_text,mission,vision,logo_url,banner_url,theme_color,address,phone,email,school_email,phones,emails,office_hours,website,facebook,instagram,youtube,map_location,facilities,activities,programs,why_choose_us,admission_cta_items,show_programs,show_news,show_notices,show_testimonials,show_awards,show_achievements')
        .eq('slug', slug)
        .eq('is_approved', true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setSchool(data as School);
      const [newsResult, awardsResult, testimonialsResult, galleryResult] = await Promise.all([
        supabase.from('news_events').select('id,title,content,event_date,event_time,location,is_event,category,is_featured,created_at').eq('school_id', data.id).order('event_date', { ascending: false }).limit(8),
        supabase.from('awards').select('id,title,year,description').eq('school_id', data.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('testimonials').select('id,name,role,content').eq('school_id', data.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('gallery_images').select('id,image_url,label').eq('school_id', data.id).order('created_at', { ascending: false }).limit(8),
      ]);

      setNews((newsResult.data || []) as NewsItem[]);
      setAwards((awardsResult.data || []) as AwardItem[]);
      setTestimonials((testimonialsResult.data || []) as Testimonial[]);
      setGallery((galleryResult.data || []) as GalleryItem[]);
      setLoading(false);
    };

    void loadSchool();
  }, [slug]);

  const programs = useMemo(() => school ? asPrograms(school.programs) : [], [school]);
  const reasons = useMemo(() => school ? asReasons(school.why_choose_us) : [], [school]);
  const admissionItems = useMemo(() => school ? asStrings(school.admission_cta_items) : [], [school]);
  const phones = useMemo(() => school ? [school.phone, ...asStrings(school.phones)].filter((item, index, all): item is string => Boolean(item) && all.indexOf(item) === index) : [], [school]);
  const emails = useMemo(() => school ? [school.email || school.school_email, ...asStrings(school.emails)].filter((item, index, all): item is string => Boolean(item) && all.indexOf(item) === index) : [], [school]);
  const items = useMemo(() => news.filter((item) => school?.show_notices !== false || item.category?.toLowerCase() !== 'notice'), [news, school]);
  const theme = themeMap[school?.theme_color || 'blue'] || themeMap.blue;
  const siteStyle = { '--brand': theme.brand, '--brand-dark': theme.dark, '--brand-soft': theme.soft } as CSSProperties;
  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    ...(school?.show_programs !== false && programs.length ? [{ label: 'Programs', href: '#programs' }] : []),
    ...(school?.show_news !== false && items.length ? [{ label: 'News', href: '#news' }] : []),
    { label: 'Contact', href: '#contact' },
  ];

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-9 w-9 animate-spin text-blue-600" /></main>;
  }

  if (notFound || !school) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <GraduationCap className="mx-auto mb-4 h-14 w-14 text-slate-300" />
          <h1 className="text-2xl font-bold text-slate-900">School website not found</h1>
          <p className="mt-2 text-slate-500">Check the website address or contact the school.</p>
        </div>
      </main>
    );
  }

  const socialLinks = [
    ['Website', school.website],
    ['Facebook', school.facebook],
    ['Instagram', school.instagram],
    ['YouTube', school.youtube],
  ].map(([label, value]) => ({ label, url: safeUrl(value) })).filter((item) => item.url);

  return (
    <div style={siteStyle} className="min-h-screen bg-white text-slate-700">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#home" className="flex min-w-0 items-center gap-3">
            {school.logo_url ? <img src={school.logo_url} alt={school.name || 'School logo'} className="h-12 w-12 rounded-xl border border-slate-200 object-contain" /> : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white" style={{ backgroundColor: theme.brand }}>{(school.name || 'S').charAt(0).toUpperCase()}</div>
            )}
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900 sm:text-lg">{school.name || 'School'}</p>
              {school.motto && <p className="hidden truncate text-xs text-slate-500 sm:block">{school.motto}</p>}
            </div>
          </a>
          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => <a key={item.href} href={item.href} className="text-sm font-semibold text-slate-600 hover:text-[var(--brand)]">{item.label}</a>)}
            <Link href={'/s/' + school.slug + '/admission'} className="rounded-lg px-4 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: theme.brand }}>Apply now</Link>
          </nav>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 text-slate-700 md:hidden" aria-label="Open navigation">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
            {navItems.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50">{item.label}</a>)}
            <Link href={'/s/' + school.slug + '/admission'} className="mt-2 block rounded-lg px-3 py-2.5 text-center font-bold text-white" style={{ backgroundColor: theme.brand }}>Apply now</Link>
          </nav>
        )}
      </header>

      <main>
        <section id="home" className="relative isolate flex min-h-[660px] items-center overflow-hidden bg-slate-950">
          {school.banner_url && <img src={school.banner_url} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/30" />
          <div className="mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {(school.school_type || school.school_level) && (
                <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">{[school.school_type, school.school_level].filter(Boolean).join(' · ')}</p>
              )}
              <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-6xl">{school.name}</h1>
              {school.motto && <p className="mt-5 text-xl font-medium text-white/90 sm:text-2xl">{school.motto}</p>}
              {school.short_description && <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">{school.short_description}</p>}
              <div className="mt-9 flex flex-wrap gap-4">
                <Link href={'/s/' + school.slug + '/admission'} className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white shadow-lg" style={{ backgroundColor: theme.brand }}>Start admission <ArrowRight className="h-5 w-5" /></Link>
                <a href="#about" className="rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur hover:bg-white/20">Explore our school</a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-slate-100 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
            {[
              { icon: CalendarDays, label: 'Established', value: school.established_year ? school.established_year + ' B.S.' : 'Growing every year' },
              { icon: GraduationCap, label: 'School level', value: school.school_level || 'Quality education' },
              { icon: ShieldCheck, label: 'School type', value: school.school_type || 'Student focused' },
            ].map((stat) => {
              const Icon = stat.icon;
              return <div key={stat.label} className="flex items-center justify-center gap-4 px-6 py-8"><Icon className="h-8 w-8" style={{ color: theme.brand }} /><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p><p className="font-bold text-slate-900">{stat.value}</p></div></div>;
            })}
          </div>
        </section>

        {(school.about_text || school.principal_message || school.mission || school.vision) && (
          <section id="about" className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionTitle eyebrow="About us" title="A school built for every learner" />
              <div className="grid gap-8 lg:grid-cols-2">
                <article className="rounded-3xl border border-slate-100 bg-slate-50 p-7 sm:p-10">
                  <Building2 className="mb-5 h-10 w-10" style={{ color: theme.brand }} />
                  <h3 className="text-2xl font-bold text-slate-900">Our story</h3>
                  <p className="mt-4 whitespace-pre-line leading-8 text-slate-600">{school.about_text || school.short_description}</p>
                </article>
                {school.principal_message && (
                  <article className="rounded-3xl p-7 text-white sm:p-10" style={{ backgroundColor: theme.dark }}>
                    <Quote className="mb-5 h-10 w-10 text-white/40" />
                    <p className="whitespace-pre-line text-lg leading-8 text-white/90">{school.principal_message}</p>
                    <p className="mt-6 font-bold">{school.principal || 'School Principal'}</p>
                    <p className="text-sm text-white/70">Principal</p>
                  </article>
                )}
              </div>
              {(school.mission || school.vision) && (
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {school.mission && <article className="rounded-2xl border border-slate-200 p-7"><Target className="mb-4 h-8 w-8" style={{ color: theme.brand }} /><h3 className="text-xl font-bold text-slate-900">Our mission</h3><p className="mt-3 whitespace-pre-line leading-7">{school.mission}</p></article>}
                  {school.vision && <article className="rounded-2xl border border-slate-200 p-7"><Award className="mb-4 h-8 w-8" style={{ color: theme.brand }} /><h3 className="text-xl font-bold text-slate-900">Our vision</h3><p className="mt-3 whitespace-pre-line leading-7">{school.vision}</p></article>}
                </div>
              )}
            </div>
          </section>
        )}

        {school.show_programs !== false && programs.length > 0 && (
          <section id="programs" className="bg-slate-50 py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionTitle eyebrow="Academics" title="Programs for meaningful learning" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {programs.map((program, index) => (
                  <article key={index} className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: theme.soft, color: theme.brand }}><BookOpen className="h-6 w-6" /></div>
                    <h3 className="text-xl font-bold text-slate-900">{program.title}</h3>
                    {program.desc && <p className="mt-3 leading-7 text-slate-600">{program.desc}</p>}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {reasons.length > 0 && (
          <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionTitle eyebrow="Why choose us" title="A place to learn, belong and grow" />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {reasons.map((reason, index) => (
                  <article key={index} className="rounded-2xl border border-slate-200 p-6">
                    <div className="mb-4 text-3xl">{reason.icon || '✓'}</div>
                    <h3 className="font-bold text-slate-900">{reason.title}</h3>
                    {reason.desc && <p className="mt-2 text-sm leading-6 text-slate-600">{reason.desc}</p>}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {school.show_news !== false && items.length > 0 && (
          <section id="news" className="bg-slate-50 py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionTitle eyebrow="Latest updates" title="News, notices and events" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: theme.soft, color: theme.brand }}>{item.category || (item.is_event ? 'Event' : 'News')}</span>
                      <span className="text-xs text-slate-400">{displayDate(item.event_date) || (item.created_at ? displayDate(item.created_at.slice(0, 10)) : '')}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                    {item.content && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.content}</p>}
                    {(item.event_time || item.location) && <p className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">{item.event_time && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{item.event_time}</span>}{item.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.location}</span>}</p>}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {gallery.length > 0 && (
          <section className="py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionTitle eyebrow="Campus life" title="Inside our school" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {gallery.map((item) => <figure key={item.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100"><img src={item.image_url} alt={item.label || 'School gallery'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />{item.label && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 text-sm font-semibold text-white">{item.label}</figcaption>}</figure>)}
              </div>
            </div>
          </section>
        )}

        {school.show_testimonials !== false && testimonials.length > 0 && (
          <section className="bg-slate-50 py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionTitle eyebrow="Community voices" title="What families say" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((item) => <article key={item.id} className="rounded-2xl bg-white p-7 shadow-sm"><Quote className="mb-4 h-7 w-7" style={{ color: theme.brand }} /><p className="leading-7 text-slate-600">{item.content}</p><p className="mt-5 font-bold text-slate-900">{item.name}</p>{item.role && <p className="text-sm text-slate-500">{item.role}</p>}</article>)}
              </div>
            </div>
          </section>
        )}

        {school.show_awards !== false && awards.length > 0 && (
          <section className="py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionTitle eyebrow="Achievements" title="Recognition we are proud of" />
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {awards.map((item) => <article key={item.id} className="flex gap-4 rounded-2xl border border-slate-200 p-6"><Trophy className="h-8 w-8 shrink-0" style={{ color: theme.brand }} /><div><h3 className="font-bold text-slate-900">{item.title}</h3>{item.year && <p className="text-sm font-semibold" style={{ color: theme.brand }}>{item.year}</p>}{item.description && <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>}</div></article>)}
              </div>
            </div>
          </section>
        )}

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl px-6 py-14 text-center text-white sm:px-12" style={{ backgroundColor: theme.brand }}>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Admissions are open</h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/85">Take the next step toward a strong education and a brighter future.</p>
            {admissionItems.length > 0 && <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">{admissionItems.map((item, index) => <span key={index} className="inline-flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4" />{item}</span>)}</div>}
            <Link href={'/s/' + school.slug + '/admission'} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-bold text-slate-900 shadow-lg">Apply online <ArrowRight className="h-5 w-5" /></Link>
          </div>
        </section>

        <section id="contact" className="bg-slate-950 py-20 text-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: theme.brand }}>Contact us</p>
              <h2 className="mt-3 text-3xl font-bold">{school.name}</h2>
              {school.address && <p className="mt-7 flex items-start gap-3 text-slate-300"><MapPin className="mt-0.5 h-5 w-5 shrink-0" />{school.address}</p>}
              {phones.map((phone) => <a key={phone} href={'tel:' + phone} className="mt-4 flex items-center gap-3 text-slate-300 hover:text-white"><Phone className="h-5 w-5" />{phone}</a>)}
              {emails.map((email) => <a key={email} href={'mailto:' + email} className="mt-4 flex items-center gap-3 text-slate-300 hover:text-white"><Mail className="h-5 w-5" />{email}</a>)}
              {school.office_hours && <p className="mt-4 flex items-start gap-3 whitespace-pre-line text-slate-300"><Clock className="mt-0.5 h-5 w-5 shrink-0" />{school.office_hours}</p>}
              {socialLinks.length > 0 && <div className="mt-7 flex flex-wrap gap-3">{socialLinks.map((item) => <a key={item.label} href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10">{item.label}<ExternalLink className="h-3.5 w-3.5" /></a>)}</div>}
            </div>
            <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              {safeUrl(school.map_location) ? <a href={safeUrl(school.map_location)} target="_blank" rel="noreferrer" className="group"><MapPin className="mx-auto h-12 w-12 transition-transform group-hover:scale-110" style={{ color: theme.brand }} /><p className="mt-4 font-bold">Open school location</p><p className="mt-2 text-sm text-slate-400">View directions in Google Maps</p></a> : <div><ImageIcon className="mx-auto h-12 w-12 text-slate-600" /><p className="mt-4 font-bold">Visit our campus</p><p className="mt-2 text-sm text-slate-400">{school.address || 'Contact the school for directions.'}</p></div>}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-7 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {school.name}. All rights reserved.</p>
          <p className="inline-flex items-center gap-2"><Newspaper className="h-4 w-4" /> Powered by SNAP</p>
        </div>
      </footer>
    </div>
  );
}
