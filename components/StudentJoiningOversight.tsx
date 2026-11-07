"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Clock3, UsersRound, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Request = {
  id: string;
  full_name: string;
  email: string | null;
  class: string | null;
  section: string | null;
  roll_no: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  created_at: string;
};

export default function StudentJoiningOversight({ onApproved }: { onApproved?: () => void }) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const call = useCallback(async (method: "GET" | "PATCH", body?: object) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sign in again to manage joining requests.");
    const response = await fetch("/api/account-requests?role=student", {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The request could not be updated.");
    return result;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await call("GET");
        if (!cancelled) setRequests(result.requests || []);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Requests could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [call]);

  async function review(request: Request, action: "approve" | "reject") {
    if (busyId) return;
    if (action === "reject" && !window.confirm(`Reject ${request.full_name}'s joining request?`)) return;
    setBusyId(request.id);
    setError("");
    setMessage("");
    try {
      await call("PATCH", { requestId: request.id, action });
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setMessage(action === "approve" ? `${request.full_name} was accepted as a student.` : `${request.full_name}'s request was rejected.`);
      if (action === "approve") onApproved?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request could not be updated.");
    } finally {
      setBusyId("");
    }
  }

  return <section className="mt-3 overflow-hidden rounded-xl border border-blue-200 bg-white shadow-sm">
    <div className="flex items-center justify-between gap-2 bg-blue-50/70 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-blue-600" />
        <div>
          <h2 className="text-sm font-bold text-slate-950">Pending student requests</h2>
          <p className="text-[10px] text-slate-500">Accept or reject students requesting access to your school.</p>
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{loading ? "—" : requests.length} waiting</span>
    </div>

    {error && <p role="alert" className="border-t border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
    {message && <p role="status" className="border-t border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p>}

    {loading ? <p className="p-4 text-center text-xs text-slate-500">Loading requests…</p> : requests.length ? (
      <div className="divide-y divide-slate-100">
        {requests.map((request) => {
          const busy = busyId === request.id;
          return <div key={request.id} className="px-3 py-3">
            <div className="flex items-start gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-extrabold text-blue-700">
                {request.full_name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950">{request.full_name}</p>
                <p className="text-[11px] text-slate-500">
                  {request.class || "Class not selected"}{request.section ? ` · Section ${request.section}` : ""}{request.roll_no ? ` · Roll ${request.roll_no}` : ""}
                </p>
                {(request.parent_name || request.parent_phone) && <p className="truncate text-[10px] text-slate-400">{request.parent_name || "Parent"}{request.parent_phone ? ` · ${request.parent_phone}` : ""}</p>}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" disabled={Boolean(busyId)} onClick={() => void review(request, "reject")} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white text-xs font-bold text-rose-600 disabled:opacity-50">
                <X className="h-4 w-4" /> Reject
              </button>
              <button type="button" disabled={Boolean(busyId)} onClick={() => void review(request, "approve")} className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm disabled:opacity-50">
                <Check className="h-4 w-4" /> {busy ? "Saving…" : "Accept"}
              </button>
            </div>
          </div>;
        })}
      </div>
    ) : (
      <div className="flex flex-col items-center gap-1 p-6 text-center text-slate-500">
        <UsersRound className="h-6 w-6" />
        <strong className="text-xs">No pending requests</strong>
        <span className="text-[10px]">New student joining requests will appear here.</span>
      </div>
    )}
  </section>;
}
