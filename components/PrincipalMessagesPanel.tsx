"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, GraduationCap, Plus, Search, Send, SlidersHorizontal, UsersRound, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Role = "teacher" | "student";
type Recipient = { userId: string; name: string; role: Role; context: string };
type Inbox = { id: string; school_id: string; principal_id: string; recipient_id: string; recipient_role: Role; updated_at: string; latest_content: string | null; latest_at: string | null; latest_sender_id: string | null; unread_count: number };
type Message = { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; read_at: string | null };
type Filter = "All" | "Unread";
const messageColumns = "id,conversation_id,sender_id,content,created_at,read_at";
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
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
  const [filter, setFilter] = useState<Filter>("All");
  const [audience, setAudience] = useState<Role>("teacher");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(newMessageKey > 0);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientFilter, setRecipientFilter] = useState<"All" | "Teachers" | "Students">("All");
  const [starting, setStarting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Inbox | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [hasOlder, setHasOlder] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const directRecipientRef = useRef<string | null>(null);

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
      supabase.from("teachers").select("user_id,name,subject,department").eq("school_id", schoolId).not("user_id", "is", null).is("left_at", null).order("name").limit(1000),
      supabase.from("students").select("user_id,name,class,section").eq("school_id", schoolId).not("user_id", "is", null).order("name").limit(1000),
    ]);
    if (teachers.error || students.error) setPeopleError("Recipients could not be loaded. Try again.");
    else {
      const teacherRows = (teachers.data || []).filter((row) => row.user_id).map((row) => ({ userId: row.user_id as string, name: row.name, role: "teacher" as const, context: row.subject || row.department ? `${row.subject || row.department} Teacher` : "Teacher" }));
      const studentRows = (students.data || []).filter((row) => row.user_id).map((row) => ({ userId: row.user_id as string, name: row.name, role: "student" as const, context: [row.class, row.section ? `Section ${row.section}` : ""].filter(Boolean).join(" · ") || "Student" }));
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

  useEffect(() => { const initial = window.setTimeout(() => void loadInbox(), 0); const timer = window.setInterval(() => void loadInbox(true), 20000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [loadInbox]);
  useEffect(() => { const initial = window.setTimeout(() => void loadRecipients(), 0); return () => window.clearTimeout(initial); }, [loadRecipients]);
  useEffect(() => { if (!selected) return; const timer = window.setInterval(() => { void loadHistory(selected.id); void markRead(selected.id); }, 20000); return () => window.clearInterval(timer); }, [selected, loadHistory, markRead]);
  const lastMessageId = history.at(-1)?.id;
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [selected?.id, lastMessageId]);

  async function openConversation(row: Inbox) {
    setNewOpen(false); setSelected(row); setHistory([]); setHistoryError(""); setHasOlder(false); setDraft("");
    await loadHistory(row.id);
    if (row.unread_count) await markRead(row.id);
  }
  async function start(recipient: Recipient) {
    if (starting) return;
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
    sendingRef.current = true; setSending(true); setHistoryError("");
    const result = await supabase.from("direct_messages").insert({ conversation_id: selected.id, school_id: schoolId, sender_id: principalId, content }).select(messageColumns).single();
    if (result.error) setHistoryError("Message could not be sent. Try again.");
    else { setDraft(""); setHistory((current) => [...current, result.data as Message]); void loadInbox(true); }
    sendingRef.current = false; setSending(false);
  }

  const matching = inbox.filter((row) => {
    const person = people.find((item) => item.userId === row.recipient_id);
    const query = search.trim().toLowerCase();
    return row.recipient_role === audience
      && (!query || [person?.name, person?.context, row.latest_content].some((value) => value?.toLowerCase().includes(query)))
      && (filter === "All" || row.unread_count > 0);
  });
  const recipientMatches = people.filter((item) => (!recipientSearch || [item.name, item.context].some((value) => value.toLowerCase().includes(recipientSearch.trim().toLowerCase()))) && (recipientFilter === "All" || item.role === recipientFilter.slice(0, -1).toLowerCase()));
  const selectedPerson = selected && people.find((item) => item.userId === selected.recipient_id);

  return <div className="space-y-3 pb-5 text-slate-950 dark:text-white">
    <div className="grid grid-cols-[minmax(0,1fr)_42px_45px_45px] items-start gap-1.5 sm:grid-cols-[minmax(0,1fr)_46px_58px_58px] sm:gap-2">
      <label className="relative block"><span className="sr-only">Search {audience === "teacher" ? "teachers" : "students"}</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${audience === "teacher" ? "teachers" : "students"}...`} className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-xs outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2 top-2.5 p-1"><X className="h-4 w-4" /></button>}</label>
      <button type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} aria-label="Conversation filters" className={`flex h-11 w-full items-center justify-center rounded-xl border ${filtersOpen || filter !== "All" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-600"} dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300`}><SlidersHorizontal className="h-4 w-4" /></button>
      {([['teacher', UsersRound, 'Teachers'], ['student', GraduationCap, 'Students']] as const).map(([role, Icon, label]) => <button key={role} type="button" onClick={() => { setAudience(role); setSearch(""); }} aria-pressed={audience === role} className={`flex min-w-0 flex-col items-center gap-0.5 text-[8px] font-semibold sm:text-[10px] ${audience === role ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}><span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 sm:h-10 sm:w-10 ${audience === role ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50" : "border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900"}`}><Icon className="h-4 w-4 sm:h-5 sm:w-5" /></span><span className="truncate">{label}</span></button>)}
    </div>
    {filtersOpen && <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-900">{(["All", "Unread"] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${filter === item ? "border-blue-300 bg-white text-blue-700 dark:border-blue-700 dark:bg-slate-800 dark:text-blue-200" : "border-transparent text-slate-600 dark:text-slate-300"}`}>{item}{item === "Unread" && unread > 0 ? ` (${unread})` : ""}</button>)}</div>}
    <section><div className="mb-2 flex items-end justify-between"><div><h3 className="text-base font-bold">Conversations</h3><p className="text-[11px] text-slate-500 dark:text-slate-400">Recent messages first.</p></div><div className="flex items-center gap-2"><span className="text-[10px] text-slate-500 dark:text-slate-400">{matching.length} conversations</span><button type="button" onClick={() => { setNewOpen(true); setRecipientFilter(audience === "teacher" ? "Teachers" : "Students"); void loadRecipients(); }} aria-label="New message" className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white"><Plus className="h-4 w-4" /></button></div></div>
      {loading && <p role="status" className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-700">Loading conversations…</p>}
      {listError && <div role="alert" className="rounded-xl border border-rose-200 p-3 text-xs text-rose-700 dark:border-rose-900 dark:text-rose-300">{listError}<button type="button" onClick={() => void loadInbox()} className="ml-2 font-semibold underline">Retry</button></div>}
      {!loading && !listError && <div className="space-y-1.5">{matching.map((row) => { const person = people.find((item) => item.userId === row.recipient_id); return <button key={row.id} type="button" onClick={() => void openConversation(row)} className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left dark:border-slate-700 dark:bg-slate-900"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-200">{initials(person?.name || "?")}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-xs">{person?.name || (row.recipient_role === "teacher" ? "Teacher" : "Student")}</strong><span className="shrink-0 text-[9px] text-slate-500 dark:text-slate-400">{time(row.latest_at)}</span></span><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{person?.context || row.recipient_role}</span><span className={`block truncate text-[10px] ${row.unread_count ? "font-bold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>{row.latest_content || "Start the conversation"}</span></span>{row.unread_count > 0 && <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">{row.unread_count}</span>}<ChevronRight className="h-3 w-3 shrink-0 text-slate-400" /></button>; })}{!matching.length && <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-xs dark:border-slate-700 dark:bg-slate-900"><strong>{filter === "Unread" && !search ? `No unread ${audience === "teacher" ? "teacher" : "student"} conversations.` : search || filter !== "All" ? "No conversations found." : `No ${audience === "teacher" ? "teacher" : "student"} conversations yet.`}</strong><p className="mt-1 text-slate-500 dark:text-slate-400">{search || filter !== "All" ? "Try another search or filter." : `Start a message with a ${audience}.`}</p></div>}</div>}
    </section>

    {newOpen && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setNewOpen(false); }}><div role="dialog" aria-modal="true" aria-label="New message" className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-slate-900 sm:rounded-2xl"><div className="flex items-center justify-between"><h3 className="text-base font-bold">New message</h3><button type="button" onClick={() => setNewOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button></div><label className="mt-3 block"><span className="sr-only">Search teacher or student</span><input value={recipientSearch} onChange={(event) => setRecipientSearch(event.target.value)} placeholder="Search teacher or student..." className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800" /></label><div className="my-2 flex gap-1.5">{(["All", "Teachers", "Students"] as const).map((item) => <button key={item} type="button" onClick={() => setRecipientFilter(item)} className={`rounded-full px-3 py-1.5 text-[11px] ${recipientFilter === item ? "bg-blue-50 font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200" : "text-slate-500 dark:text-slate-400"}`}>{item}</button>)}</div>{peopleError && <p role="alert" className="mb-2 text-xs text-rose-600">{peopleError}<button type="button" onClick={() => void loadRecipients()} className="ml-2 underline">Retry</button></p>}<div className="min-h-20 overflow-y-auto">{peopleLoading ? <p className="p-3 text-xs text-slate-500">Loading recipients…</p> : recipientMatches.length ? recipientMatches.map((item) => <button key={item.userId} type="button" disabled={Boolean(starting)} onClick={() => void start(item)} className="flex w-full items-center gap-2 border-t border-slate-100 py-2 text-left disabled:opacity-50 dark:border-slate-700"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-200">{initials(item.name)}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.name}</strong><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{item.context}</span></span><span className="text-[10px] font-bold text-blue-600 dark:text-blue-300">{starting === item.userId ? "Opening…" : "Message"}</span></button>) : <p className="p-3 text-center text-xs text-slate-500">No teachers or students matching your search with portal access.</p>}</div></div></div>}

    {selected && <div className="fixed inset-0 z-[80] flex justify-center bg-white text-slate-950 dark:bg-slate-950 dark:text-white lg:bg-slate-950/60 lg:p-5 lg:dark:bg-slate-950/80"><div className="flex h-[100dvh] w-full max-w-2xl flex-col bg-white dark:bg-slate-950 lg:h-full lg:overflow-hidden lg:rounded-2xl lg:border lg:border-slate-700"><header className="flex shrink-0 items-center gap-2 border-b border-slate-200 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-slate-700"><button type="button" onClick={() => { setSelected(null); void loadInbox(true); }} aria-label="Back to conversations" className="rounded p-1"><ArrowLeft className="h-5 w-5" /></button><span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-200">{initials(selectedPerson?.name || "?")}</span><div className="min-w-0"><h3 className="truncate text-xs font-bold">{selectedPerson?.name || (selected.recipient_role === "teacher" ? "Teacher" : "Student")}</h3><p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{selectedPerson?.context || selected.recipient_role}</p></div></header><div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 py-3 dark:bg-slate-900">{hasOlder && <button type="button" disabled={olderLoading} onClick={() => void loadHistory(selected.id, true, history.length)} className="mx-auto mb-3 block rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-blue-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800">{olderLoading ? "Loading…" : "Load older messages"}</button>}{historyLoading && !history.length && <p className="text-center text-xs text-slate-500">Loading messages…</p>}{historyError && <p role="alert" className="mb-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">{historyError}</p>}{!historyLoading && !history.length && <p className="mt-10 text-center text-xs text-slate-500">No messages yet. Say hello.</p>}{history.map((item, index) => <div key={item.id}>{(index === 0 || dateGroup(item.created_at) !== dateGroup(history[index - 1].created_at)) && <p className="my-3 text-center text-[10px] text-slate-500 dark:text-slate-400">{dateGroup(item.created_at)}</p>}<div className={`mb-2 flex ${item.sender_id === principalId ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-5 ${item.sender_id === principalId ? "rounded-br-sm bg-blue-600 text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"}`}><p className="whitespace-pre-wrap break-words">{item.content}</p><p className={`mt-0.5 text-right text-[9px] ${item.sender_id === principalId ? "text-blue-100" : "text-slate-400"}`}>{time(item.created_at)}</p></div></div></div>)}<div ref={chatEnd} /></div><form onSubmit={send} className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-700 dark:bg-slate-950"><label className="min-w-0 flex-1"><span className="sr-only">Write a message</span><textarea rows={1} maxLength={5000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." className="max-h-28 min-h-10 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900" /></label><button type="submit" disabled={sending || !draft.trim()} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></form></div></div>}
  </div>;
}
