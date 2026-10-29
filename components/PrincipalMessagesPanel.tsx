"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Check, CheckCheck, ChevronRight, FileText, GraduationCap, MessagesSquare, MoreVertical, Pencil, Search, Send, SlidersHorizontal, Trash2, UsersRound, X } from "lucide-react";
import TeacherAvatar from "@/components/TeacherAvatar";
import { activateTeacherAvatarCache } from "@/lib/teacher-avatars";
import { supabase } from "@/lib/supabase";
import { useDirectMessageRealtime, type DirectRealtimeMessage } from "@/lib/use-direct-message-realtime";

type Role = "teacher" | "student";
type Recipient = { userId: string; name: string; role: Role; context: string; canMessage: boolean; avatarPath: string | null };
type Inbox = { id: string; school_id: string; principal_id: string; recipient_id: string; recipient_role: Role; updated_at: string; latest_content: string | null; latest_at: string | null; latest_sender_id: string | null; unread_count: number };
type Message = { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; read_at: string | null };
type Filter = "All" | "Unread";
const messageColumns = "id,conversation_id,sender_id,content,created_at,read_at";
const time = (value: string | null) => value ? new Date(value).toLocaleTimeString("en-NP", { hour: "numeric", minute: "2-digit" }) : "";
const dateGroup = (value: string) => {
  const day = new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Kathmandu" });
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kathmandu" });
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Kathmandu" });
  return day === today ? "Today" : day === yesterday ? "Yesterday" : new Date(value).toLocaleDateString("en-NP", { month: "short", day: "numeric", year: "numeric" });
};
export default function PrincipalMessagesPanel({ schoolId, principalId, newMessageKey, initialRecipientId, onUnread }: {
  schoolId: string; principalId: string; newMessageKey: number; initialRecipientId?: string | null; onUnread: (count: number) => void;
}) {
  const [inbox, setInbox] = useState<Inbox[]>([]);
  const [unread, setUnread] = useState(0);
  const [people, setPeople] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState("");
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentRecipientIds, setRecentRecipientIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [audience, setAudience] = useState<Role>("teacher");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Inbox | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [hasOlder, setHasOlder] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [deletingMessages, setDeletingMessages] = useState(false);
  const [deliveredIds, setDeliveredIds] = useState<Set<string>>(() => new Set());
  const [timestampMessageId, setTimestampMessageId] = useState<string | null>(null);
  const sendingRef = useRef(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const directRecipientRef = useRef<string | null>(null);
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const [avatarScope] = useState(() => activateTeacherAvatarCache(principalId, schoolId));

  const loadInbox = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    const [rows, unreadResult] = await Promise.all([
      supabase.from("direct_conversation_inbox").select("id,school_id,principal_id,recipient_id,recipient_role,updated_at,latest_content,latest_at,latest_sender_id,unread_count", { count: "exact" }).eq("school_id", schoolId).eq("principal_id", principalId).order("updated_at", { ascending: false }).range(0, 99),
      supabase.from("direct_messages").select("id", { count: "exact", head: true }).eq("school_id", schoolId).neq("sender_id", principalId).is("read_at", null),
    ]);
    if (rows.error || unreadResult.error) setListError("Messages could not be loaded. Try again.");
    else { setInbox((rows.data || []) as Inbox[]); setUnread(unreadResult.count || 0); onUnread(unreadResult.count || 0); setListError(""); }
    setLoading(false);
  }, [schoolId, principalId, onUnread]);

  const loadRecipients = useCallback(async () => {
    setPeopleLoading(true); setPeopleError("");
    const [teachers, students] = await Promise.all([
      supabase.from("teachers").select("id,user_id,name,subject,department,avatar_path").eq("school_id", schoolId).is("left_at", null).order("name").limit(1000),
      supabase.from("students").select("id,user_id,name,class,section").eq("school_id", schoolId).order("name").limit(1000),
    ]);
    if (teachers.error || students.error) setPeopleError("Recipients could not be loaded. Try again.");
    else {
      const teacherRows = (teachers.data || []).map((row) => ({ userId: row.user_id || `pending-teacher:${row.id}`, name: row.name, role: "teacher" as const, context: row.subject || row.department ? `${row.subject || row.department} Teacher` : "Teacher", canMessage: Boolean(row.user_id), avatarPath: row.avatar_path || null }));
      const studentRows = (students.data || []).map((row) => ({ userId: row.user_id || `pending-student:${row.id}`, name: row.name, role: "student" as const, context: [row.class, row.section ? `Section ${row.section}` : ""].filter(Boolean).join(" · ") || "Student", canMessage: Boolean(row.user_id), avatarPath: null }));
      setPeople([...new Map([...teacherRows, ...studentRows].map((row) => [row.userId, row])).values()]);
    }
    setPeopleLoading(false);
  }, [schoolId]);

  const loadHistory = useCallback(async (conversationId: string, older = false, offset = 0) => {
    if (older) setOlderLoading(true); else setHistoryLoading(true);
    const result = await supabase.from("direct_messages").select(messageColumns).eq("school_id", schoolId).eq("conversation_id", conversationId).order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 29);
    if (result.error) setHistoryError("Conversation could not be loaded. Try again.");
    else {
      const incoming = ((result.data || []) as Message[]).reverse();
      setHasOlder((result.data || []).length === 30);
      setHistory((current) => older ? [...incoming, ...current.filter((item) => !incoming.some((row) => row.id === item.id))] : [...new Map([...current, ...incoming].map((item) => [item.id, item])).values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)));
      setHistoryError("");
    }
    if (older) setOlderLoading(false); else setHistoryLoading(false);
  }, [schoolId]);

  const markRead = useCallback(async (conversationId: string) => {
    const { error } = await supabase.from("direct_messages").update({ read_at: new Date().toISOString() }).eq("school_id", schoolId).eq("conversation_id", conversationId).neq("sender_id", principalId).is("read_at", null);
    if (!error) void loadInbox(true);
  }, [schoolId, principalId, loadInbox]);

  const publishRealtime = useDirectMessageRealtime(selected?.id || null, principalId, useCallback((message: DirectRealtimeMessage) => {
    setHistory((current) => current.some((item) => item.id === message.id)
      ? current
      : [...current, message].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)));
    if (message.sender_id !== principalId) void markRead(message.conversation_id);
    void loadInbox(true);
  }, [principalId, markRead, loadInbox]), useCallback((messageId: string) => {
    setDeliveredIds((current) => new Set(current).add(messageId));
  }, []));

  useEffect(() => { const initial = window.setTimeout(() => void loadInbox(), 0); const timer = window.setInterval(() => void loadInbox(true), 20000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [loadInbox]);
  useEffect(() => { const initial = window.setTimeout(() => void loadRecipients(), 0); return () => window.clearTimeout(initial); }, [loadRecipients]);
  useEffect(() => { if (newMessageKey > 0) setSearchFocused(true); }, [newMessageKey]);
  useEffect(() => {
    try { setRecentRecipientIds(JSON.parse(window.localStorage.getItem(`principal-message-recents:${schoolId}`) || "[]")); }
    catch { setRecentRecipientIds([]); }
  }, [schoolId]);
  useEffect(() => { if (!selected) return; const timer = window.setInterval(() => { void loadHistory(selected.id); void markRead(selected.id); }, 20000); return () => window.clearInterval(timer); }, [selected, loadHistory, markRead]);
  const lastMessageId = history.at(-1)?.id;
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [selected?.id, lastMessageId]);

  async function openConversation(row: Inbox) {
    setSearchFocused(false); setChatMenuOpen(false); setSelected(row); setHistory([]); setDeliveredIds(new Set()); setTimestampMessageId(null); setHistoryError(""); setHasOlder(false); setDraft("");
    await loadHistory(row.id);
    if (row.unread_count) await markRead(row.id);
  }
  async function start(recipient: Recipient) {
    if (starting) return;
    setRecentRecipientIds((current) => {
      const next = [recipient.userId, ...current.filter((id) => id !== recipient.userId)].slice(0, 7);
      window.localStorage.setItem(`principal-message-recents:${schoolId}`, JSON.stringify(next));
      return next;
    });
    if (!recipient.canMessage) {
      setPeopleError(`${recipient.name} cannot receive messages until their portal login is active.`);
      return;
    }
    setStarting(recipient.userId); setPeopleError("");
    try {
      let id = inbox.find((item) => item.recipient_id === recipient.userId)?.id;
      if (!id) {
        const existing = await supabase.from("direct_conversations").select("id").eq("school_id", schoolId).eq("principal_id", principalId).eq("recipient_id", recipient.userId).maybeSingle();
        if (existing.error) throw existing.error;
        id = existing.data?.id;
      }
      if (!id) {
        const created = await supabase.from("direct_conversations").insert({ school_id: schoolId, principal_id: principalId, recipient_id: recipient.userId, recipient_role: recipient.role }).select("id").single();
        if (created.error?.code === "23505") {
          const existing = await supabase.from("direct_conversations").select("id").eq("school_id", schoolId).eq("principal_id", principalId).eq("recipient_id", recipient.userId).single();
          if (existing.error) throw existing.error;
          id = existing.data.id;
        } else if (created.error) throw created.error;
        else id = created.data.id;
      }
      if (!id) throw new Error("Conversation missing");
      const row: Inbox = inbox.find((item) => item.id === id) || { id, school_id: schoolId, principal_id: principalId, recipient_id: recipient.userId, recipient_role: recipient.role, updated_at: new Date().toISOString(), latest_content: null, latest_at: null, latest_sender_id: null, unread_count: 0 };
      await openConversation(row);
      void loadInbox(true);
    } catch (cause) { console.error("Message recipient failed", cause); setPeopleError("Conversation could not be opened. Check account access and try again."); }
    finally { setStarting(null); }
  }

  useEffect(() => {
    if (!initialRecipientId || peopleLoading || directRecipientRef.current === initialRecipientId) return;
    const recipient = people.find((item) => item.userId === initialRecipientId);
    if (!recipient) return;
    directRecipientRef.current = initialRecipientId;
    void start(recipient);
  }, [initialRecipientId, people, peopleLoading]);
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!selected || !content || sendingRef.current) return;
    const optimisticId = `sending-${crypto.randomUUID()}`;
    const optimisticMessage: Message = { id: optimisticId, conversation_id: selected.id, sender_id: principalId, content, created_at: new Date().toISOString(), read_at: null };
    sendingRef.current = true; setSending(true); setHistoryError(""); setDraft("");
    setHistory((current) => [...current, optimisticMessage]);
    const result = await supabase.from("direct_messages").insert({ conversation_id: selected.id, school_id: schoolId, sender_id: principalId, content }).select(messageColumns).single();
    if (result.error) {
      setHistory((current) => current.filter((item) => item.id !== optimisticId));
      setDraft((current) => current || content);
      setHistoryError("Message could not be sent. Try again.");
    } else {
      setHistory((current) => current.map((item) => item.id === optimisticId ? result.data as Message : item));
      void publishRealtime(result.data as Message);
      void loadInbox(true);
    }
    sendingRef.current = false; setSending(false);
  }

  async function deleteConversationMessages() {
    if (!selected || deletingMessages) return;
    if (!window.confirm("Delete all messages in this conversation? This cannot be undone.")) return;
    setDeletingMessages(true);
    setChatMenuOpen(false);
    setHistoryError("");
    const result = await supabase
      .from("direct_messages")
      .delete()
      .eq("school_id", schoolId)
      .eq("conversation_id", selected.id);
    setDeletingMessages(false);
    if (result.error) {
      setHistoryError("Messages could not be deleted. Try again.");
      return;
    }
    setHistory([]);
    setHasOlder(false);
    setDeliveredIds(new Set());
    setTimestampMessageId(null);
    await loadInbox(true);
  }

  const matching = inbox.filter((row) => {
    const person = people.find((item) => item.userId === row.recipient_id);
    const query = search.trim().toLowerCase();
    return row.recipient_role === audience
      && (!query || [person?.name, person?.context, row.latest_content].some((value) => value?.toLowerCase().includes(query)))
      && (filter === "All" || row.unread_count > 0);
  });
  const browsingRecipients = searchFocused || Boolean(search.trim());
  const recipientMatches = people.filter((item) => item.role === audience && (!search.trim() || [item.name, item.context].some((value) => value.toLowerCase().includes(search.trim().toLowerCase()))));
  const recentRecipients = recentRecipientIds.map((id) => people.find((item) => item.userId === id && item.role === audience)).filter((item): item is Recipient => Boolean(item));
  const selectedPerson = selected && people.find((item) => item.userId === selected.recipient_id);

  return <div className="space-y-3 pb-5 text-slate-950 dark:text-white">
    <div ref={searchAreaRef} className="grid scroll-mt-2 grid-cols-[minmax(0,1fr)_34px_40px_40px] items-start gap-[2px] sm:grid-cols-[minmax(0,1fr)_38px_52px_52px] sm:gap-1">
      <label className="relative block"><span className="sr-only">Search {audience === "teacher" ? "teachers" : "students"}</span><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={search} onFocus={() => { setSearchFocused(true); window.setTimeout(() => searchAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120); }} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${audience === "teacher" ? "teachers" : "students"}...`} className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-7 text-xs outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900" />{(search || searchFocused) && <button type="button" onClick={() => { setSearch(""); setSearchFocused(false); }} aria-label="Close search" className="absolute right-1.5 top-1.5 p-1"><X className="h-3.5 w-3.5" /></button>}</label>
      <button type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} aria-label="Conversation filters" className={`flex h-9 w-full items-center justify-center rounded-lg border ${filtersOpen || filter !== "All" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-600"} dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300`}><SlidersHorizontal className="h-3.5 w-3.5" /></button>
      {([['teacher', UsersRound, 'Teachers'], ['student', GraduationCap, 'Students']] as const).map(([role, Icon, label]) => <button key={role} type="button" onClick={() => { setAudience(role); setSearch(""); }} aria-pressed={audience === role} className={`flex min-w-0 flex-col items-center gap-0.5 text-[8px] font-semibold sm:text-[10px] ${audience === role ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}><span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 sm:h-10 sm:w-10 ${audience === role ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50" : "border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900"}`}><Icon className="h-4 w-4 sm:h-5 sm:w-5" /></span><span className="truncate">{label}</span></button>)}
    </div>
    {filtersOpen && <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-900">{(["All", "Unread"] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${filter === item ? "border-blue-300 bg-white text-blue-700 dark:border-blue-700 dark:bg-slate-800 dark:text-blue-200" : "border-transparent text-slate-600 dark:text-slate-300"}`}>{item}{item === "Unread" && unread > 0 ? ` (${unread})` : ""}</button>)}</div>}
    <section className="!mt-1"><div className="mb-1 flex items-center justify-between"><h3 className="text-base font-bold">{browsingRecipients ? (audience === "teacher" ? "Teachers" : "Students") : "Conversations"}</h3>{!browsingRecipients && <span className="text-[10px] text-slate-500 dark:text-slate-400">{matching.length} conversations</span>}</div>
      {browsingRecipients ? <div className="space-y-1.5">{!search.trim() && recentRecipients.length > 0 && <div><p className="mb-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">Recent</p><div className="flex gap-2 overflow-x-auto pb-1">{recentRecipients.map((item) => <button key={`recent-${item.userId}`} type="button" onClick={() => void start(item)} className="w-14 shrink-0 text-center"><TeacherAvatar name={item.name} path={item.avatarPath} scope={avatarScope} className="mx-auto h-10 w-10 rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-200" /><span className="mt-0.5 block truncate text-[9px] font-semibold">{item.name.split(" ")[0]}</span></button>)}</div></div>}{peopleError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">{peopleError}<button type="button" onClick={() => { setPeopleError(""); void loadRecipients(); }} className="ml-2 font-semibold underline">Refresh</button></p>}{peopleLoading ? <p className="rounded-xl border border-slate-200 p-3 text-xs text-slate-500 dark:border-slate-700">Loading {audience === "teacher" ? "teachers" : "students"}…</p> : recipientMatches.length ? <div className="max-h-[350px] space-y-1.5 overflow-y-auto pr-0.5">{recipientMatches.map((item) => <button key={item.userId} type="button" disabled={Boolean(starting)} onClick={() => void start(item)} className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"><TeacherAvatar name={item.name} path={item.avatarPath} scope={avatarScope} className="h-9 w-9 rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-200" /><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.name}</strong><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{item.context}</span></span><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${item.canMessage ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200" : "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"}`}>{starting === item.userId ? "Opening…" : item.canMessage ? "Message" : "Login pending"}</span>{item.canMessage && <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />}</button>)}</div> : <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-xs dark:border-slate-700 dark:bg-slate-900"><strong>No {audience === "teacher" ? "teachers" : "students"} found.</strong></div>}</div> : <>{loading && <p role="status" className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-700">Loading conversations…</p>}{listError && <div role="alert" className="rounded-xl border border-rose-200 p-3 text-xs text-rose-700 dark:border-rose-900 dark:text-rose-300">{listError}<button type="button" onClick={() => void loadInbox()} className="ml-2 font-semibold underline">Retry</button></div>}{!loading && !listError && <div className="space-y-1.5">{matching.map((row) => { const person = people.find((item) => item.userId === row.recipient_id); return <button key={row.id} type="button" onClick={() => void openConversation(row)} className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left dark:border-slate-700 dark:bg-slate-900"><TeacherAvatar name={person?.name || "?"} path={person?.avatarPath} scope={avatarScope} className="h-9 w-9 rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-200" /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-xs">{person?.name || (row.recipient_role === "teacher" ? "Teacher" : "Student")}</strong><span className="shrink-0 text-[9px] text-slate-500 dark:text-slate-400">{time(row.latest_at)}</span></span><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{person?.context || row.recipient_role}</span><span className={`block truncate text-[10px] ${row.unread_count ? "font-bold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>{row.latest_content || "Start the conversation"}</span></span>{row.unread_count > 0 && <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">{row.unread_count}</span>}<ChevronRight className="h-3 w-3 shrink-0 text-slate-400" /></button>; })}{!matching.length && <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-xs dark:border-slate-700 dark:bg-slate-900"><strong>{filter === "Unread" ? `No unread ${audience === "teacher" ? "teacher" : "student"} conversations.` : `No ${audience === "teacher" ? "teacher" : "student"} conversations yet.`}</strong><p className="mt-1 text-slate-500 dark:text-slate-400">Search above to start a message.</p></div>}</div>}</>}
    </section>

    {selected && <div className="fixed inset-0 z-[80] flex justify-center bg-white text-slate-950 lg:bg-slate-950/60 lg:p-5">
      <div className="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white lg:h-full lg:rounded-2xl lg:border lg:border-slate-200">
        <header className="relative flex min-h-[68px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 pt-[env(safe-area-inset-top)] shadow-sm">
          <button type="button" onClick={() => { setChatMenuOpen(false); setSelected(null); void loadInbox(true); }} aria-label="Back to conversations" className="flex h-10 w-8 shrink-0 items-center justify-center text-slate-800"><ArrowLeft className="h-6 w-6" /></button>
          <span className="relative shrink-0"><TeacherAvatar name={selectedPerson?.name || "?"} path={selectedPerson?.avatarPath} scope={avatarScope} className="h-11 w-11 rounded-full border border-slate-200 bg-blue-100 text-xs font-bold text-blue-700" />{selectedPerson?.canMessage && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" aria-label="Portal account active" />}</span>
          <div className="min-w-0 flex-1"><h3 className="truncate text-[17px] font-extrabold leading-tight">{selectedPerson?.name || (selected.recipient_role === "teacher" ? "Teacher" : "Student")}</h3><p className="mt-0.5 truncate text-xs font-medium capitalize text-slate-500">{selected.recipient_role}</p></div>
          <button type="button" onClick={() => setChatMenuOpen((open) => !open)} aria-label="Conversation options" aria-expanded={chatMenuOpen} className="grid h-10 w-9 shrink-0 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"><MoreVertical className="h-5 w-5" aria-hidden="true" /></button>
          {chatMenuOpen && <><button type="button" aria-label="Close conversation options" className="fixed inset-0 z-[85] cursor-default" onClick={() => setChatMenuOpen(false)} /><div className="absolute right-3 top-[calc(100%+6px)] z-[90] min-w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><button type="button" disabled={deletingMessages || !history.length} onClick={() => void deleteConversationMessages()} className="flex h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"><Trash2 className="h-4 w-4" />{deletingMessages ? "Deleting…" : "Delete messages"}</button></div></>}
        </header>
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#f7faff]">
          <ChatPattern />
          <div className="relative z-10 h-full overflow-y-auto px-3 py-3">
            {hasOlder && <button type="button" disabled={olderLoading} onClick={() => void loadHistory(selected.id, true, history.length)} className="mx-auto mb-3 block rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-blue-600 disabled:opacity-50">{olderLoading ? "Loading…" : "Load older messages"}</button>}
            {historyLoading && !history.length && <p className="pt-10 text-center text-xs text-slate-500">Loading messages…</p>}
            {historyError && <p role="alert" className="mb-2 rounded-lg border border-rose-200 bg-white/90 p-2 text-xs text-rose-700">{historyError}</p>}
            {!historyLoading && !history.length && !historyError && <div className="flex min-h-full flex-col items-center justify-center pb-16 text-center"><span className="relative flex h-28 w-32 items-center justify-center"><span className="absolute bottom-4 right-2 h-14 w-16 rounded-[22px] bg-blue-300/80" /><span className="relative flex h-20 w-24 items-center justify-center rounded-[28px] bg-slate-200 text-slate-400 shadow-[0_16px_28px_rgba(148,163,184,0.18)]"><MessagesSquare className="h-10 w-10" /></span></span><h4 className="mt-2 text-xl font-extrabold">No messages yet</h4><p className="mt-1 text-sm text-slate-500">Start the conversation with {selectedPerson?.name?.split(/\s+/)[0] || (selected.recipient_role === "teacher" ? "this teacher" : "this student")}.</p></div>}
            {history.map((item, index) => {
              const own = item.sender_id === principalId;
              const showMeta = index === history.length - 1 || history[index + 1].sender_id !== item.sender_id;
              const saved = !item.id.startsWith("sending-");
              const received = Boolean(item.read_at) || deliveredIds.has(item.id);
              const showTime = timestampMessageId === item.id;
              return <div key={item.id}>{(index === 0 || dateGroup(item.created_at) !== dateGroup(history[index - 1].created_at)) && <p className="my-2 text-center text-[10px] text-slate-500">{dateGroup(item.created_at)}</p>}<div className={`mb-1 flex flex-col ${own ? "items-end" : "items-start"}`}><button type="button" onClick={() => setTimestampMessageId((current) => current === item.id ? null : item.id)} aria-label={`${showTime ? "Hide" : "Show"} message time`} className={`max-w-[82%] rounded-2xl px-2.5 py-1.5 text-left text-xs leading-4 shadow-sm ${own ? "rounded-br-sm bg-blue-600 text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-900"}`}><span className="whitespace-pre-wrap break-words">{item.content}</span></button>{(showTime || (showMeta && own && saved)) && <span className="mt-0.5 flex items-center gap-1 px-1 text-[9px] text-slate-400">{showTime && <span>{time(item.created_at)}</span>}{showMeta && own && saved && (received ? <CheckCheck className="h-3 w-3" aria-label="Received" /> : <Check className="h-3 w-3" aria-label="Sent" />)}</span>}</div></div>;
            })}
            <div ref={chatEnd} />
          </div>
        </div>
        <form onSubmit={send} className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-3 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          <div className="flex min-w-0 flex-1 items-center rounded-full border border-slate-300 bg-white px-2 shadow-sm"><label className="min-w-0 flex-1"><span className="sr-only">Write a message</span><textarea rows={1} maxLength={5000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." className="max-h-24 min-h-9 w-full resize-none bg-transparent px-2 py-2 text-sm leading-5 outline-none placeholder:text-slate-400" /></label></div>
          <button type="submit" disabled={sending || !draft.trim()} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-300/40 transition active:scale-95 disabled:bg-blue-300 disabled:shadow-none"><Send className="h-4 w-4 -rotate-6" /></button>
        </form>
      </div>
    </div>}
  </div>;
}


function ChatPattern() {
  const marks = [
    ["message", "left-[7%] top-[9%]"], ["file", "left-[22%] top-[3%]"], ["book", "left-[48%] top-[13%]"], ["pencil", "left-[67%] top-[7%]"], ["cap", "right-[8%] top-[2%]"],
    ["cap", "left-[6%] top-[31%]"], ["message", "right-[18%] top-[25%]"], ["book", "right-[5%] top-[36%]"], ["file", "left-[8%] top-[56%]"], ["pencil", "right-[8%] top-[52%]"],
    ["message", "left-[17%] top-[72%]"], ["cap", "left-[61%] top-[76%]"], ["book", "right-[7%] top-[82%]"], ["pencil", "left-[6%] top-[84%]"], ["file", "left-[34%] top-[88%]"],
  ] as const;
  return <div className="pointer-events-none absolute inset-0 overflow-hidden text-slate-300/30" aria-hidden="true">{marks.map(([kind, position], index) => { const Icon = kind === "message" ? MessagesSquare : kind === "file" ? FileText : kind === "book" ? BookOpen : kind === "pencil" ? Pencil : GraduationCap; return <Icon key={index} className={`absolute h-10 w-10 ${position} ${index % 2 ? "-rotate-12" : "rotate-12"}`} strokeWidth={1.2} />; })}</div>;
}

