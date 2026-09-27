"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint, TrendSummary } from "@/lib/attendance-trend";

function Metric({ label, tone, summary, student = false }: { label: string; tone: string; summary: TrendSummary; student?: boolean }) {
  const detail = student && summary.inProgress
    ? `${summary.recorded} of ${summary.total} classes have recorded attendance`
    : summary.percentage !== null
      ? `${summary.present} of ${summary.expected} ${student ? "students" : "expected staff"} present`
      : student ? "No complete attendance today" : "No complete staff attendance today";
  return <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300"><span className={`h-2 w-2 shrink-0 rounded-full ${tone}`} />{label}</p>
    <p className="mt-1 text-xl font-extrabold text-slate-950 dark:text-white">{summary.inProgress && student ? "In progress" : summary.percentage !== null ? `${summary.percentage}%` : "—"}</p>
    <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{detail}</p>
  </div>;
}

export default function AttendanceTrend({ points, student, staff }: { points: TrendPoint[]; student: TrendSummary; staff: TrendSummary }) {
  const [days, setDays] = useState(7);
  const shown = points.slice(-days);
  const tickDates = new Set(shown.filter((_, index) => index === 0 || index === shown.length - 1 || index % Math.max(1, Math.ceil((shown.length - 1) / 3)) === 0).map((point) => point.date));
  return <section aria-labelledby="attendance-trend-title" className="mt-5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:mt-6 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div><h2 id="attendance-trend-title" className="text-base font-bold text-slate-950 dark:text-white sm:text-lg">Attendance trend</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Students vs staff across recent school days</p></div>
      <label className="shrink-0"><span className="sr-only">Attendance trend range</span><select value={days} onChange={(event) => setDays(Number(event.target.value))} className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"><option value={7}>7 days</option><option value={14}>14 days</option><option value={30}>30 days</option></select></label>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2"><Metric label="Student attendance" tone="bg-blue-600" student summary={student} /><Metric label="Staff attendance" tone="bg-emerald-600" summary={staff} /></div>
    {shown.length ? <div role="img" aria-label={`Attendance trend over ${shown.length} recorded school days`} className="mt-3 h-[220px] min-w-0 w-full sm:h-[240px]">
      <ResponsiveContainer width="100%" height="100%"><LineChart data={shown} margin={{ top: 12, right: 8, bottom: 4, left: -18 }}>
        <CartesianGrid stroke="var(--color-slate-300)" strokeOpacity={0.45} vertical={false} strokeDasharray="4 4" />
        <XAxis dataKey="date" tickFormatter={(date: string) => shown.find((point) => point.date === date)?.day || date} ticks={[...tickDates]} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-slate-500)', fontSize: 10 }} interval={0} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(value: number) => `${value}%`} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-slate-500)', fontSize: 10 }} width={46} />
        <Tooltip contentStyle={{ background: 'var(--color-slate-900)', color: 'white', border: 0, borderRadius: 12 }} labelFormatter={(date) => shown.find((point) => point.date === date)?.day || date} formatter={(value, name) => [value === null ? 'Not recorded' : `${value}%`, name === 'students' ? 'Students' : 'Staff']} />
        <Line type="monotone" dataKey="students" name="students" stroke="#3154d8" strokeWidth={2.5} dot={shown.length <= 14 ? { r: 2, strokeWidth: 0 } : false} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="staff" name="staff" stroke="#15803d" strokeWidth={2.5} dot={shown.length <= 14 ? { r: 2, strokeWidth: 0 } : false} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
      </LineChart></ResponsiveContainer>
    </div> : <p className="mt-3 rounded-xl bg-slate-50 px-4 py-9 text-center text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">No completed school-day attendance to chart yet.</p>}
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-600" />Students</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-600" />Staff</span><span className="text-slate-500 dark:text-slate-400">Recorded school days only</span></div>
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-700"><p className="text-[11px] text-slate-500 dark:text-slate-400">Holidays and unrecorded days are excluded.</p><Link href="/principal/attendance" className="inline-flex min-h-10 shrink-0 items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300">View attendance <ArrowRight className="h-3.5 w-3.5" /></Link></div>
  </section>;
}
