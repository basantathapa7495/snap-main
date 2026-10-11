'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpenText, Building2, CalendarDays, ChevronDown, ChevronRight, CircleHelp, Clock3, FileText, Globe2, GraduationCap, ImagePlus, Info, Loader2, Mail, MapPin, MessageCircleMore, Phone, Search, Send, UserRound, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Screen = 'home' | 'faq' | 'contact' | 'report' | 'about';
type SchoolDetails = { id: string; name: string | null; phone: string | null; email: string | null; address: string | null; municipality: string | null; district: string | null; map_location: string | null; office_hours: string | null };

const faqGroups = [
  { title: 'Account & Login', subtitle: 'Password, login issues, profile, etc.', icon: UserRound, answer: 'Use Change Password from your profile menu to update your password. If you cannot sign in, contact your school so they can verify your account.' },
  { title: 'Profile & Information', subtitle: 'View and update your information.', icon: Info, answer: 'Open your profile menu and choose View Profile. Your school manages official academic details; contact the school if any information is incorrect.' },
  { title: 'Timetable', subtitle: 'Class schedule and periods.', icon: CalendarDays, answer: 'Open Timetable from the bottom navigation. The latest schedule published by your school appears there.' },
  { title: 'Assignments', subtitle: 'How to view and submit assignments.', icon: FileText, answer: 'Open Assignments, select an item, attach the requested work, and submit it before the due date. Late work is available only when the teacher allows it.' },
  { title: 'Exams & Results', subtitle: 'View exam schedule and results.', icon: GraduationCap, answer: 'Published exam schedules and results appear in the academic sections of your student portal.' },
  { title: 'Documents', subtitle: 'Access shared documents.', icon: BookOpenText, answer: 'Open Documents from the bottom navigation to view or download files shared with you by your school.' },
  { title: 'Notices', subtitle: 'School notices and announcements.', icon: MessageCircleMore, answer: 'Open Notices to read announcements. You can choose which alerts you receive from Notification Settings.' },
  { title: 'Other', subtitle: 'General questions.', icon: CircleHelp, answer: 'For anything not covered here, use Contact Your School or submit a report with a short description of the issue.' },
];

const menuItems = [
  { screen: 'faq' as Screen, title: 'Frequently Asked Questions', detail: 'Find answers to common questions about using the student portal.', icon: BookOpenText },
  { screen: 'contact' as Screen, title: 'Contact Your School', detail: 'Get in touch with your school for academic or account related support.', icon: Phone },
  { screen: 'report' as Screen, title: 'Report a Problem', detail: "Let us know if something isn't working correctly.", icon: MessageCircleMore },
  { screen: 'about' as Screen, title: 'About NEPSOM', detail: 'Learn more about NEPSOM and important information.', icon: Info },
];

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return <header className="sticky top-0 z-20 flex min-h-[72px] items-center gap-3 border-b border-slate-100 bg-white/95 px-4 backdrop-blur sm:px-6"><button type="button" onClick={onBack} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-900 transition hover:bg-slate-100" aria-label="Go back"><ArrowLeft className="h-6 w-6" /></button><h1 className="min-w-0 truncate text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{title}</h1></header>;
}

function HelpIllustration() {
  return <div className="relative mx-auto h-40 w-56" aria-hidden="true"><div className="absolute right-3 top-4 grid h-16 w-16 place-items-center rounded-[24px_24px_24px_5px] bg-blue-100 text-4xl font-black text-blue-600">?</div><div className="absolute bottom-2 left-12 h-20 w-24 rounded-t-[48px] bg-blue-100" /><div className="absolute left-[75px] top-11 h-16 w-14 rounded-[45%] bg-orange-200" /><div className="absolute left-[69px] top-6 h-9 w-[68px] -rotate-6 rounded-[55%_55%_35%_35%] bg-slate-800" /><div className="absolute bottom-1 left-[105px] h-14 w-28 -skew-x-6 rounded-md bg-slate-800 shadow-lg"><span className="absolute right-8 top-5 h-2.5 w-2.5 rounded-full bg-slate-400" /></div><span className="absolute left-5 top-16 h-1.5 w-8 rotate-45 rounded-full bg-blue-200" /><span className="absolute left-3 top-24 h-1.5 w-7 rounded-full bg-blue-200" /></div>;
}

export default function StudentHelpPage() {
  const router = useRouter();
  const screenshotRef = useRef<HTMLInputElement>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [school, setSchool] = useState<SchoolDetails | null>(null);
  const [userId, setUserId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !auth.user) { setLoadError('Please sign in to open Help & Support.'); setLoading(false); return; }
      setUserId(auth.user.id);
      const profile = await supabase.from('profiles').select('school_id').eq('user_id', auth.user.id).maybeSingle();
      if (!active) return;
      if (profile.error || !profile.data?.school_id) { setLoadError('Your school details are not available yet.'); setLoading(false); return; }
      setSchoolId(profile.data.school_id);
      const result = await supabase.from('schools').select('id,name,phone,email,address,municipality,district,map_location,office_hours').eq('id', profile.data.school_id).maybeSingle();
      if (!active) return;
      if (result.error) setLoadError('Could not load your school contact details.'); else setSchool(result.data as SchoolDetails | null);
      setLoading(false);
    }
    load(); return () => { active = false; };
  }, []);

  useEffect(() => { const onPopState = () => setScreen('home'); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState); }, []);
  const filteredFaqs = useMemo(() => { const needle = search.trim().toLowerCase(); return needle ? faqGroups.filter(item => `${item.title} ${item.subtitle} ${item.answer}`.toLowerCase().includes(needle)) : faqGroups; }, [search]);

  function openScreen(next: Screen) { if (next === 'home') return; window.history.pushState({ ...window.history.state, studentHelpScreen: next }, ''); setScreen(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function goBack() { if (screen !== 'home') { if (window.history.state?.studentHelpScreen) window.history.back(); else setScreen('home'); return; } router.push('/student'); }
  function chooseScreenshot(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0] || null; event.target.value = ''; setReportError(''); if (!file) return; if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setReportError('Choose a JPG, PNG, or WebP image.'); if (file.size > 5 * 1024 * 1024) return setReportError('Screenshot must be 5 MB or smaller.'); setScreenshot(file); }

  async function submitReport(event: FormEvent) {
    event.preventDefault();
    if (!category || !subject.trim() || !description.trim()) return setReportError('Choose a category and complete the subject and description.');
    if (!userId || !schoolId) return setReportError('Your student account could not be verified.');
    setSubmitting(true); setReportError(''); let uploadedPath = '';
    try {
      const reportId = crypto.randomUUID();
      if (screenshot) {
        const extension = screenshot.type === 'image/png' ? 'png' : screenshot.type === 'image/webp' ? 'webp' : 'jpg';
        uploadedPath = `${userId}/${reportId}/screenshot.${extension}`;
        const upload = await supabase.storage.from('student-support-screenshots').upload(uploadedPath, screenshot, { contentType: screenshot.type, upsert: false });
        if (upload.error) throw upload.error;
      }
      const created = await supabase.from('student_support_reports').insert({ id: reportId, school_id: schoolId, created_by: userId, category, subject: subject.trim(), description: description.trim(), screenshot_path: uploadedPath || null });
      if (created.error) throw created.error;
      setSubmitted(true); setCategory(''); setSubject(''); setDescription(''); setScreenshot(null);
    } catch (cause) { if (uploadedPath) await supabase.storage.from('student-support-screenshots').remove([uploadedPath]); setReportError(cause instanceof Error ? cause.message : 'Could not submit the report. Please try again.'); } finally { setSubmitting(false); }
  }

  const location = school?.address || [school?.municipality, school?.district].filter(Boolean).join(', ') || 'Address not provided';
  if (loading) return <div className="grid min-h-screen place-items-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  const title = screen === 'home' ? 'Help & Support' : screen === 'faq' ? 'Frequently Asked Questions' : screen === 'contact' ? 'Contact Your School' : screen === 'report' ? 'Report a Problem' : 'About NEPSOM';

  return <main className="min-h-screen bg-slate-50 text-slate-950"><div className="mx-auto min-h-screen max-w-3xl bg-white shadow-sm"><PageHeader title={title} onBack={goBack} />
    {loadError && <p role="alert" className="mx-5 mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{loadError}</p>}
    {screen === 'home' && <section className="px-5 pb-10 pt-5 sm:px-8"><HelpIllustration /><div className="text-center"><h2 className="text-2xl font-extrabold tracking-tight">How can we help you?</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Find answers, get support or contact your school.</p></div><div className="mt-7 space-y-3">{menuItems.map(({ screen: itemScreen, title: itemTitle, detail, icon: Icon }) => <button key={itemScreen} type="button" onClick={() => openScreen(itemScreen)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/30"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Icon className="h-6 w-6" /></span><span className="min-w-0 flex-1"><strong className="block text-[15px]">{itemTitle}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span></span><ChevronRight className="h-5 w-5 shrink-0 text-slate-500" /></button>)}</div></section>}
    {screen === 'faq' && <section className="px-5 pb-10 pt-5 sm:px-8"><label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"><Search className="h-5 w-5 text-slate-500" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search questions..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X className="h-4 w-4 text-slate-400" /></button>}</label><div className="mt-5 space-y-3">{filteredFaqs.map(item => { const Icon = item.icon; const open = openFaq === item.title; return <article key={item.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><button type="button" onClick={() => setOpenFaq(open ? null : item.title)} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-blue-700"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-[15px]">{item.title}</strong><span className="mt-0.5 block text-xs text-slate-500">{item.subtitle}</span></span><ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} /></button>{open && <p className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm leading-6 text-slate-600">{item.answer}</p>}</article>; })}{!filteredFaqs.length && <p className="py-10 text-center text-sm text-slate-500">No matching questions found.</p>}</div></section>}
    {screen === 'contact' && <section className="px-5 pb-10 pt-6 sm:px-8"><p className="text-sm leading-6 text-slate-600">Get in touch with your school for academic or account related support.</p><div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-200 p-4 shadow-sm"><span className="grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-blue-700"><Building2 className="h-7 w-7" /></span><div><h2 className="font-extrabold">{school?.name || 'Your School'}</h2><p className="mt-1 text-sm text-slate-500">{[school?.municipality, school?.district].filter(Boolean).join(', ') || location}</p></div></div><div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 shadow-sm"><ContactRow icon={Phone} title="Phone" value={school?.phone || 'Not provided'} action={school?.phone ? <a href={`tel:${school.phone}`} className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">Call</a> : null} /><ContactRow icon={Mail} title="Email" value={school?.email || 'Not provided'} action={school?.email ? <a href={`mailto:${school.email}`} className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">Email</a> : null} /><ContactRow icon={MapPin} title="Address" value={location} action={school?.map_location ? <a href={school.map_location} target="_blank" rel="noreferrer" className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">View</a> : null} /><ContactRow icon={Clock3} title="Office Hours" value={school?.office_hours || 'Contact the school for office hours'} /></div><div className="mt-5 rounded-2xl bg-blue-50 p-5"><div className="flex gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><div><h3 className="font-bold">Need help with?</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600"><li>Your profile or account information</li><li>Timetable or class related queries</li><li>Assignments, exams or results</li><li>Any other school related support</li></ul></div></div></div></section>}
    {screen === 'report' && <section className="px-5 pb-10 pt-6 sm:px-8">{submitted ? <div className="flex min-h-[65vh] flex-col items-center justify-center text-center"><span className="grid h-28 w-28 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Send className="h-12 w-12" /></span><h2 className="mt-6 text-2xl font-extrabold">Report Submitted!</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Your report has been sent securely. Your school can follow up if more details are needed.</p><button type="button" onClick={() => { setSubmitted(false); setScreen('home'); }} className="mt-8 w-full rounded-2xl bg-blue-600 px-5 py-3.5 font-bold text-white">Back to Help & Support</button></div> : <form onSubmit={submitReport}><p className="text-sm leading-6 text-slate-600">Tell us about the issue you&apos;re facing. We&apos;ll try to help as soon as possible.</p><label className="mt-6 block text-sm font-bold">Issue Category<select value={category} onChange={event => setCategory(event.target.value)} className={`${inputClass} mt-2`} required><option value="">Select a category</option>{faqGroups.map(item => <option key={item.title} value={item.title === 'Other' ? 'other' : item.title.toLowerCase().replaceAll(' & ', '_').replaceAll(' ', '_')}>{item.title}</option>)}</select></label><label className="mt-5 block text-sm font-bold">Subject<input value={subject} onChange={event => setSubject(event.target.value.slice(0, 120))} className={`${inputClass} mt-2`} placeholder="Brief title of the issue" required /></label><label className="mt-5 block text-sm font-bold">Description<textarea value={description} onChange={event => setDescription(event.target.value.slice(0, 500))} className={`${inputClass} mt-2 min-h-36 resize-none`} placeholder="Describe the problem in detail..." required /><span className="mt-1 block text-right text-xs font-normal text-slate-500">{description.length}/500</span></label><div className="mt-5"><p className="text-sm font-bold">Screenshot (Optional)</p><input ref={screenshotRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={chooseScreenshot} /><button type="button" onClick={() => screenshotRef.current?.click()} className="mt-2 flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center transition hover:border-blue-400 hover:bg-blue-50"><ImagePlus className="h-8 w-8 text-blue-700" /><strong className="mt-3 text-sm">{screenshot ? screenshot.name : 'Tap to upload image'}</strong><span className="mt-1 text-xs text-slate-500">JPG, PNG or WebP (Max 5MB)</span></button></div>{reportError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{reportError}</p>}<button disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}{submitting ? 'Submitting…' : 'Submit Report'}</button></form>}</section>}
    {screen === 'about' && <section className="px-5 pb-10 pt-10 text-center sm:px-8"><span className="mx-auto grid h-28 w-28 place-items-center rounded-[28px] bg-blue-50 text-blue-700"><GraduationCap className="h-14 w-14" /></span><h2 className="mt-5 text-3xl font-black">NEPSOM</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Nepal Education Platform for School Operations and Management</p><div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 text-left shadow-sm"><InfoRow icon={FileText} label="Version" value="0.1.0" /><InfoRow icon={Globe2} label="Website" value={<a href="https://nepsom.xyz" target="_blank" rel="noreferrer" className="font-bold text-blue-600">nepsom.xyz</a>} /></div><div className="mt-6 rounded-2xl bg-slate-50 p-6 text-left"><h3 className="font-extrabold">Our Mission</h3><p className="mt-3 text-sm leading-6 text-slate-600">NEPSOM helps schools in Nepal manage their daily operations easily with simple, modern and accessible technology.</p><div className="mx-auto my-5 h-px w-20 bg-slate-200" /><p className="text-center text-sm text-slate-500">Built with <span aria-label="love">❤️</span> for schools in Nepal.</p></div></section>}
  </div></main>;
}

function ContactRow({ icon: Icon, title, value, action }: { icon: typeof Phone; title: string; value: string; action?: React.ReactNode }) { return <div className="flex min-h-24 items-center gap-3 border-b border-slate-100 p-4 last:border-0"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-50 text-blue-700"><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><strong className="block text-sm">{title}</strong><span className="mt-1 whitespace-pre-line break-words text-sm leading-5 text-slate-500">{value}</span></div>{action}</div>; }
function InfoRow({ icon: Icon, label, value }: { icon: typeof Info; label: string; value: React.ReactNode }) { return <div className="flex min-h-20 items-center gap-3 border-b border-slate-100 px-4 last:border-0"><Icon className="h-5 w-5 text-blue-700" /><span className="flex-1 text-sm font-bold">{label}</span><span className="text-sm text-slate-500">{value}</span></div>; }
