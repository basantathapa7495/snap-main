"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarDays, ChevronRight, Clock3, Edit3, FileText, GraduationCap, Mail, Send, UsersRound } from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
import PrincipalNoticesPanel, { type SchoolNotice } from "@/components/PrincipalNoticesPanel";
import PrincipalMessagesPanel from "@/components/PrincipalMessagesPanel";
import { supabase } from "@/lib/supabase";

type Tab = "overview" | "notices" | "messages" | "scheduled";
type Audience = "all" | "teachers" | "students" | "class" | "section";
function dateLabel(value: string | null) {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function relativeTime(value: string | null) {
  if (!value) return "Date unavailable";
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : dateLabel(value);
}

export default function CommunicationPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [principalId, setPrincipalId] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [messageKey, setMessageKey] = useState(0);
  const [notices, setNotices] = useState<SchoolNotice[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [teacherCount, setTeacherCount] = useState<number | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [countsError, setCountsError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [initialNoticeId, setInitialNoticeId] = useState<string | null>(null);
  const [composerAudience, setComposerAudience] = useState<Audience | null>(null);
  const [composerKey, setComposerKey] = useState(0);
  const [initialFilter, setInitialFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError("");
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) { if (!cancelled) setAuthenticated(false); return; }
        const { data: profile, error: profileError } = await supabase.from("profiles").select("school_id,role").eq("user_id", user.id).single();
        if (profileError || !profile?.school_id || profile.role !== "admin") throw new Error("School access unavailable.");
        const [noticeResult, teacherResult, studentResult, unreadResult] = await Promise.all([
          supabase.from("notices").select("id,school_id,title,content,target_audience,target_class,target_section,status,scheduled_at,published_at,created_at,updated_at,created_by").eq("school_id", profile.school_id).order("created_at", { ascending: false }),
          supabase.from("teachers").select("id", { count: "exact", head: true }).eq("school_id", profile.school_id),
          supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", profile.school_id),
          supabase.from("direct_messages").select("id", { count: "exact", head: true }).eq("school_id", profile.school_id).neq("sender_id", user.id).is("read_at", null),
        ]);
        if (noticeResult.error) throw noticeResult.error;
        if (!cancelled) {
          setSchoolId(profile.school_id);
          setPrincipalId(user.id);
          if (!unreadResult.error) setUnreadMessages(unreadResult.count || 0);
          setNotices((noticeResult.data || []) as SchoolNotice[]);
          setTeacherCount(teacherResult.error ? null : teacherResult.count || 0);
          setStudentCount(studentResult.error ? null : studentResult.count || 0);
          setCountsError(teacherResult.error || studentResult.error ? "Audience counts could not be loaded." : "");
          if (refreshKey === 0) {
            const params = new URLSearchParams(window.location.search);
            const requestedTab = params.get("tab");
            if (["notices", "messages", "scheduled"].includes(requestedTab || "")) setTab(requestedTab as Tab);
            const requestedNotice = params.get("notice");
            if (requestedNotice && (noticeResult.data || []).some((item) => item.id === requestedNotice)) { setInitialNoticeId(requestedNotice); setTab("notices"); }
            else if (params.get("action") === "create") { setComposerAudience("all"); setComposerKey((value) => value + 1); setTab("notices"); }
          }
        }
      } catch (cause) {
        console.error("Communication load error", cause);
        if (!cancelled) setError("Communication data could not be loaded. Please try again.");
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  function chooseTab(value: Tab) {
    setTab(value);
    setInitialNoticeId(null);
    setComposerAudience(null);
    setInitialFilter("All");
    window.history.replaceState(window.history.state, "", value === "overview" ? window.location.pathname : `${window.location.pathname}?tab=${value}`);
  }
  function openComposer(audience: Audience = "all") {
    setComposerAudience(audience); setComposerKey((value) => value + 1); setTab("notices");
  }
  const handleUnread = useCallback((count: number) => setUnreadMessages(count), []);
  function openNewMessage() { setMessageKey((value) => value + 1); setTab("messages"); }

  if (loading) return <PageSkeleton />;
  if (!authenticated) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="rounded-xl bg-white p-6 text-center"><h1 className="text-lg font-bold">Please sign in</h1><Link href="/auth/login?role=principal" className="mt-3 inline-block text-sm text-blue-600">Go to login</Link></div></main>;

  return <div className="min-h-screen bg-white dark:bg-slate-950"><Sidebar /><div className="flex min-h-screen flex-col pt-10 lg:ml-64"><TopBar /><main className="flex-1 px-3.5 pb-28 pt-7 sm:px-6 lg:px-8 lg:pt-24"><div className="mx-auto max-w-[1500px]">
    <header className="-mx-3.5 bg-gradient-to-br from-[#e7f2ff] via-[#f5faff] to-[#9dbcf4] px-4 py-5 dark:from-[#132a49] dark:via-[#182d49] dark:to-[#1b365b] sm:mx-0 sm:rounded-2xl sm:border sm:border-blue-100 sm:px-8 sm:py-7 sm:dark:border-blue-900/60"><h1 className="text-[1.7rem] font-extrabold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl">Communication</h1><p className="mt-1 text-xs text-slate-700 dark:text-blue-100 sm:text-base">Notices, messages and school announcements in one place.</p></header>
    <nav aria-label="Communication sections" className="mb-3 mt-2 flex gap-5 overflow-x-auto border-b border-slate-200 dark:border-slate-700 [scrollbar-width:none]">{(["overview","notices","messages","scheduled"] as const).map((item) => <button key={item} type="button" onClick={() => chooseTab(item)} className={`shrink-0 border-b-2 px-0.5 py-2 text-xs font-semibold capitalize sm:text-sm ${tab === item ? "border-blue-600 text-blue-700 dark:text-blue-300" : "border-transparent text-slate-500 dark:text-slate-400"}`}>{item}</button>)}</nav>
    {tab === "overview" && <CommunicationOverview notices={notices} unreadMessages={unreadMessages} error={error} teacherCount={teacherCount} studentCount={studentCount} countsError={countsError} audienceInfo="" onAudience={(audience) => openComposer(audience === "Everyone" ? "all" : audience.toLowerCase() as Audience)} onNotice={(item) => { setComposerAudience(null); setInitialNoticeId(item.id); setTab("notices"); }} onTab={chooseTab} onCreate={() => openComposer()} onNewMessage={openNewMessage} onDrafts={() => { setComposerAudience(null); setInitialFilter("Drafts"); setTab("notices"); }} />}
    {tab === "notices" && schoolId && <PrincipalNoticesPanel key={`${initialNoticeId || ""}-${composerKey}-${initialFilter}`} schoolId={schoolId} notices={notices} onChanged={() => setRefreshKey((value) => value + 1)} initialNoticeId={initialNoticeId} composerAudience={composerAudience} composerKey={composerKey} initialFilter={initialFilter} />}
    {tab === "notices" && !schoolId && error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
    {tab === "messages" && schoolId && principalId && <PrincipalMessagesPanel schoolId={schoolId} principalId={principalId} newMessageKey={messageKey} onUnread={handleUnread} />}
    {tab === "messages" && !schoolId && error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
    {tab === "scheduled" && <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><h2 className="text-sm font-bold text-slate-950 dark:text-white">Scheduled communications</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">The full Scheduled page is coming later. Scheduled notices appear in Notices and in Overview.</p></section>}
  </div></main></div></div>;
}

function CommunicationOverview({ notices, unreadMessages, error, teacherCount, studentCount, countsError, audienceInfo, onAudience, onNotice, onTab, onCreate, onNewMessage, onDrafts }: {
  notices: SchoolNotice[];
  unreadMessages: number;
  error: string;
  teacherCount: number | null;
  studentCount: number | null;
  countsError: string;
  audienceInfo: string;
  onAudience: (audience: 'Teachers' | 'Students' | 'Everyone') => void;
  onNotice: (item: SchoolNotice) => void;
  onTab: (tab: 'overview' | 'notices' | 'messages' | 'scheduled') => void;
  onCreate: () => void;
  onNewMessage: () => void;
  onDrafts: () => void;
}) {
  const published = notices.filter((item) => item.status === 'published');
  const scheduled = notices.filter((item) => item.status === 'scheduled').sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime());
  const summary = [
    { label: 'Published', count: String(published.length), icon: Bell, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
    { label: 'Scheduled', count: String(scheduled.length), icon: Clock3, tone: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300' },
    { label: 'Drafts', count: String(notices.filter((item) => item.status === 'draft').length), icon: Edit3, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300' },
    { label: 'Unread', count: String(unreadMessages), icon: Mail, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' },
  ];
  const actions = [
    { title: 'Send Notice', detail: 'School announcement', icon: Bell, action: onCreate, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' },
    { title: 'New Message', detail: 'Message someone', icon: Mail, action: onNewMessage, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' },
    { title: 'Schedule', detail: 'Send later', icon: CalendarDays, action: () => onTab('scheduled'), tone: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30' },
    { title: 'Drafts', detail: 'Continue writing', icon: FileText, action: onDrafts, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' },
  ];
  const audiences = [
    { title: 'Teachers' as const, members: teacherCount === null ? 'Unavailable' : `${teacherCount} members`, icon: GraduationCap },
    { title: 'Students' as const, members: studentCount === null ? 'Unavailable' : `${studentCount} members`, icon: UsersRound },
    { title: 'Everyone' as const, members: 'Whole school', icon: Send },
  ];
  return <div className="space-y-4 pb-6 text-slate-950 dark:text-white">
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}</p>}
    <section aria-label="Communication summary" className="grid grid-cols-4 gap-1.5 sm:gap-3">{summary.map(({ label, count, icon: Icon, tone }) => <div key={label} title={count === '—' ? `${label} data is not available in the current communication system` : undefined} className="min-w-0 rounded-xl border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900 sm:px-3 sm:py-2"><span className={`flex h-5 w-5 items-center justify-center rounded-md ${tone}`}><Icon className="h-3 w-3" /></span><strong className="mt-1 block text-base leading-none sm:text-xl">{count}</strong><span className="mt-1 block truncate text-[9px] leading-none text-slate-500 dark:text-slate-400 sm:text-xs">{label}</span></div>)}</section>

    <section><div className="mb-2"><h2 className="text-base font-bold">Quick Actions</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">Reach the right people quickly.</p></div><div className="grid grid-cols-2 gap-2">{actions.map(({ title, detail, icon: Icon, action, tone }) => <button key={title} type="button" onClick={action} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left dark:border-slate-700 dark:bg-slate-900"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><strong className="block truncate text-xs">{title}</strong><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{detail}</span></span></button>)}</div></section>

    <section><div className="mb-2"><h2 className="text-base font-bold">Send To</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">Start communication by audience.</p></div>{countsError && <p role="alert" className="mb-2 text-xs text-rose-600">{countsError}</p>}{audienceInfo && <p role="status" className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">{audienceInfo}</p>}<div className="grid grid-cols-3 gap-1.5">{audiences.map(({ title, members, icon: Icon }) => <button key={title} type="button" onClick={() => onAudience(title)} className="min-w-0 rounded-xl border border-slate-200 bg-white p-2 text-left dark:border-slate-700 dark:bg-slate-900"><Icon className="mb-1 h-4 w-4 text-blue-600 dark:text-blue-300" /><strong className="block truncate text-[11px]">{title}</strong><span className="block truncate text-[9px] text-slate-500 dark:text-slate-400">{members}</span></button>)}</div></section>

    <section><div className="mb-2 flex items-end justify-between gap-2"><div><h2 className="text-base font-bold">Recent Notices</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">Latest school announcements.</p></div><button type="button" onClick={() => onTab('notices')} className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-300">View all</button></div><div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">{published.slice(0, 4).map((item) => <button key={item.id} type="button" onClick={() => onNotice(item)} className="flex w-full items-center gap-2 px-3 py-2 text-left"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"><Bell className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.title}</strong><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{item.target_audience === 'all' ? 'Everyone' : item.target_audience === 'teachers' ? 'Teachers' : item.target_audience === 'students' ? 'Students' : item.target_class || 'School'} • {relativeTime(item.published_at || item.created_at)}</span></span><span className="rounded-full bg-emerald-50 px-1.5 py-1 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Published</span><ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" /></button>)}{!published.length && <p className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">No notices published yet.</p>}</div></section>

    <section><div className="mb-2 flex items-end justify-between gap-2"><div><h2 className="text-base font-bold">Scheduled</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">Communications waiting to be published.</p></div><button type="button" onClick={() => onTab('scheduled')} className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-300">View all</button></div><div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">{scheduled.slice(0, 3).map((item) => <button key={item.id} type="button" onClick={() => onNotice(item)} className="flex w-full items-center gap-2 p-2 text-left"><span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-50 text-[9px] font-bold leading-tight text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">{item.scheduled_at ? new Date(item.scheduled_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).split(' ').map((part) => <span key={part}>{part}</span>) : '—'}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.title}</strong><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{item.target_audience === 'all' ? 'Everyone' : item.target_audience === 'teachers' ? 'Teachers' : item.target_audience === 'students' ? 'Students' : item.target_class || 'School'} • {item.scheduled_at ? new Date(item.scheduled_at).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' }) : ''}</span></span><ChevronRight className="h-4 w-4 text-slate-400" /></button>)}{!scheduled.length && <p className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">Nothing scheduled yet.</p>}</div></section>
  </div>;
}

function PageSkeleton() {
  return <div className="min-h-screen bg-white dark:bg-slate-950"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="px-3.5 pb-28 pt-7 sm:px-6 lg:pt-24"><div className="mx-auto max-w-[1500px] animate-pulse"><div className="h-24 rounded-xl bg-blue-50 dark:bg-slate-900" /><div className="mt-2 h-8 border-b border-slate-200 dark:border-slate-700" /><div className="mt-3 grid grid-cols-4 gap-1.5">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-900" />)}</div><div className="mt-4 grid grid-cols-2 gap-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-900" />)}</div></div></main></div></div>;
}
