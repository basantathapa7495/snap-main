"use client";

import { useEffect, useState } from "react";
import { Clock3, UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Request = { id: string; full_name: string; class: string | null; section: string | null; created_at: string };

export default function StudentJoiningOversight() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sign in again to view joining requests.");
        const response = await fetch("/api/account-requests?role=student", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Requests could not be loaded.");
        if (!cancelled) setRequests(result.requests || []);
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Requests could not be loaded."); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, []);
  return <section className="mt-3 overflow-hidden rounded-xl border border-violet-200 bg-white dark:border-violet-900 dark:bg-slate-900">
    <div className="flex items-center justify-between gap-2 bg-violet-50/60 px-3 py-2.5 dark:bg-violet-950/20"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-violet-600" /><div><h2 className="text-sm font-bold text-slate-950 dark:text-white">Pending student requests</h2><p className="text-[10px] text-slate-500 dark:text-slate-400">Teachers review requests for their assigned classes.</p></div></div><span className="shrink-0 rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">{loading ? "—" : requests.length} waiting</span></div>
    {error ? <p role="alert" className="p-3 text-xs text-rose-600">{error}</p> : loading ? <p className="p-4 text-center text-xs text-slate-500">Loading requests…</p> : requests.length ? <div className="divide-y divide-slate-100 dark:divide-slate-700">{requests.map((request) => <div key={request.id} className="flex items-center justify-between gap-2 px-3 py-2"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{request.full_name}</p><p className="text-[10px] text-slate-500 dark:text-slate-400">{request.class || "Class not selected"}{request.section ? ` · Section ${request.section}` : ""}</p></div><span className="text-[10px] text-amber-600">Awaiting teacher</span></div>)}</div> : <div className="flex flex-col items-center gap-1 p-6 text-center text-slate-500 dark:text-slate-400"><UsersRound className="h-6 w-6" /><strong className="text-xs">No pending requests</strong><span className="text-[10px]">New student joining requests will appear here.</span></div>}
  </section>;
}
