'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, CalendarDays, ChevronLeft, ChevronRight, Coffee,
  Layers3, Users,
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';
import {
  addDays, type Assignment, formatTime, isoDate, type Period,
  statusFor, weekStart,
} from '@/lib/teacher-timetable';

type ClassRow = {
  id:string; class_name:string|null; class:string|null; name:string|null;
  section:string|null; section_name:string|null; class_number:string|null;
};
type Holiday = { id:string; title:string; event_date:string; end_date:string|null };
type Data = { assignments:Assignment[]; periods:Period[]; classes:ClassRow[]; holidays:Holiday[]; year:number };
type Entry = { period:Period; assignment?:Assignment };

const tones = [
  'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
];
const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950';
const classLabel = (c?:ClassRow) => c
  ? [c.class_name||c.class||c.name||c.class_number,c.section_name||c.section].filter(Boolean).join(' ')
  : 'Assigned class';
const dateLabel = (value:string, options?:Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US',options||{weekday:'short',month:'short',day:'numeric',year:'numeric'})
    .format(new Date(`${value}T12:00:00`));

export default function TeacherTimetable() {
  const [data,setData]=useState<Data|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [tab,setTab]=useState<'today'|'week'|'full'>('today');
  const [date,setDate]=useState(()=>isoDate(new Date()));
  const [weekOffset,setWeekOffset]=useState(0);
  const [filter,setFilter]=useState<'classes'|'subject'>('classes');

  useEffect(()=>{
    let active=true;
    async function load() {
      try {
        setLoading(true);
        const {data:auth,error:authError}=await supabase.auth.getUser();
        if(authError||!auth.user) throw new Error('Please sign in with your teacher account.');
        const {data:profile,error:profileError}=await supabase.from('profiles').select('school_id,role').eq('user_id',auth.user.id).single();
        if(profileError||profile?.role!=='teacher'||!profile.school_id) throw new Error('Teacher school access unavailable.');
        const {data:teacher,error:teacherError}=await supabase.from('teachers').select('id').eq('school_id',profile.school_id).eq('user_id',auth.user.id).is('left_at',null).single();
        if(teacherError||!teacher) throw new Error('Active teacher membership unavailable.');
        const [assignmentResult,periodResult,classResult,holidayResult]=await Promise.all([
          supabase.from('teacher_assignments').select('id,class_id,class_name,subject,period_id,weekday,academic_year').eq('school_id',profile.school_id).eq('teacher_id',teacher.id).eq('active',true),
          supabase.from('school_periods').select('id,name,kind,position,start_time,end_time,academic_year').eq('school_id',profile.school_id).order('position'),
          supabase.from('classes').select('id,class_name,class,name,class_number,section,section_name').eq('school_id',profile.school_id).is('archived_at',null),
          supabase.from('news_events').select('id,title,event_date,end_date').eq('school_id',profile.school_id).eq('is_event',true).eq('category','holiday'),
        ]);
        const loadError=assignmentResult.error||periodResult.error||classResult.error||holidayResult.error;
        if(loadError) throw loadError;
        const assignments=(assignmentResult.data||[]) as Assignment[];
        const years=assignments.map(item=>Number(item.academic_year)).filter(Number.isFinite);
        const year=years.length?Math.max(...years):new Date().getFullYear();
        if(active) setData({
          assignments:assignments.filter(item=>!item.academic_year||Number(item.academic_year)===year),
          periods:((periodResult.data||[]) as Period[]).filter(item=>item.academic_year===year),
          classes:(classResult.data||[]) as ClassRow[],
          holidays:(holidayResult.data||[]) as Holiday[],
          year,
        });
      } catch (reason) {
        if(active) setError(reason instanceof Error?reason.message:'Could not load timetable.');
      } finally {
        if(active) setLoading(false);
      }
    }
    void load();
    return ()=>{active=false};
  },[]);

  const selectedDay=new Date(`${date}T12:00:00`).getDay();
  const workingDays=useMemo(()=>Array.from(new Set((data?.assignments||[])
    .map(item=>item.weekday).filter((item):item is number=>item!==null))).sort(),[data]);
  const entries=useMemo<Entry[]>(()=>{
    if(!data) return [];
    return data.periods.map(period=>({
      period,
      assignment:data.assignments.find(item=>item.period_id===period.id&&(item.weekday===selectedDay||item.weekday===null)),
    }));
  },[data,selectedDay]);
  const holiday=data?.holidays.find(item=>date>=item.event_date&&date<=(item.end_date||item.event_date));
  const assigned=entries.filter(item=>item.assignment);
  const freePeriods=entries.filter(item=>item.period.kind==='lesson'&&!item.assignment).length;
  const classCount=new Set(assigned.map(item=>item.assignment!.class_id)).size;
  const subjectCount=new Set(assigned.map(item=>item.assignment!.subject)).size;
  const weekBase=addDays(weekStart(date),weekOffset*7);
  const weekDays=(workingDays.length?workingDays:[1,2,3,4,5]).map(day=>addDays(weekBase,day));

  if(loading) return <Shell><div className="mx-auto max-w-6xl animate-pulse space-y-4"><div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800"/><div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800"/></div></Shell>;
  if(error||!data) return <Shell><div className={`${card} mx-auto max-w-xl p-6 text-center`}><h1 className="font-bold">Timetable unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p><button onClick={()=>location.reload()} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Retry</button></div></Shell>;

  return <Shell><div className="mx-auto max-w-6xl space-y-5 text-slate-950 dark:text-slate-50">
    <header><h1 className="text-3xl font-extrabold tracking-tight">Timetable</h1><p className="mt-1 text-sm text-slate-500">View your class schedule and manage your periods.</p></header>
    <div className="sticky top-16 z-20 grid grid-cols-3 border-b bg-slate-50/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      {([['today','Today'],['week','This Week'],['full','Full Timetable']] as const).map(([value,name])=>
        <button key={value} onClick={()=>setTab(value)} className={`border-b-2 px-2 py-3 text-sm font-semibold ${tab===value?'border-blue-600 text-blue-600':'border-transparent text-slate-500'}`}>{name}</button>)}
    </div>
    {tab==='today'&&<>
      <DateControl date={date} setDate={setDate}/>
      <div className="grid grid-cols-4 gap-2">
        <Summary icon={BookOpen} value={entries.length} label="Total Periods" tone="blue"/>
        <Summary icon={Users} value={classCount} label="Classes" tone="green"/>
        <Summary icon={Layers3} value={subjectCount} label="Subjects" tone="violet"/>
        <Summary icon={Coffee} value={freePeriods} label="Free Periods" tone="amber"/>
      </div>
      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Today&apos;s Schedule</h2><button onClick={()=>setTab('full')} className="text-sm font-semibold text-blue-600">View full timetable →</button></div>
        {holiday?<Empty title={holiday.title} body="School holiday — no classes are scheduled."/>:
          workingDays.length&&!workingDays.includes(selectedDay)?<Empty title="Non-working day" body="There are no timetable assignments for this day."/>:
          <div className="space-y-2">{entries.map((item,index)=><ScheduleRow key={item.period.id} item={item} date={date} cls={data.classes.find(c=>c.id===item.assignment?.class_id)} tone={tones[index%tones.length]}/>)}</div>}
      </section>
    </>}
    {tab==='week'&&<>
      <div className="flex items-center justify-between"><button aria-label="Previous week" onClick={()=>setWeekOffset(value=>value-1)} className={`${card} p-2`}><ChevronLeft/></button><div className="text-center"><b>This Week</b><p className="text-xs text-slate-500">{dateLabel(weekDays[0],{month:'short',day:'numeric'})} – {dateLabel(weekDays.at(-1)!,{month:'short',day:'numeric',year:'numeric'})}</p></div><button aria-label="Next week" onClick={()=>setWeekOffset(value=>value+1)} className={`${card} p-2`}><ChevronRight/></button></div>
      <div className="flex gap-2 overflow-x-auto pb-1">{weekDays.map(value=><button key={value} onClick={()=>setDate(value)} className={`min-w-16 rounded-xl px-3 py-2 text-center ${date===value?'bg-blue-600 text-white':card}`}><span className="block text-xs">{dateLabel(value,{weekday:'short'})}</span><b>{new Date(`${value}T12:00:00`).getDate()}</b></button>)}</div>
      <div className="space-y-2">{entries.map((item,index)=><ScheduleRow key={item.period.id} item={item} date={date} cls={data.classes.find(c=>c.id===item.assignment?.class_id)} tone={tones[index%tones.length]}/>)}</div>
    </>}
    {tab==='full'&&<>
      <div className="grid grid-cols-2 border-b dark:border-slate-800"><FilterButton active={filter==='classes'} onClick={()=>setFilter('classes')}>My Classes</FilterButton><FilterButton active={filter==='subject'} onClick={()=>setFilter('subject')}>By Subject</FilterButton></div>
      <div className={`${card} overflow-x-auto`}><table className="w-full min-w-[720px] text-xs"><thead><tr className="border-b dark:border-slate-800"><th className="p-3 text-left">Time</th>{weekDays.map(value=><th key={value} className="p-3">{dateLabel(value,{weekday:'short'})}</th>)}</tr></thead>
        <tbody>{data.periods.map((period,periodIndex)=><tr key={period.id} className="border-b last:border-0 dark:border-slate-800"><td className="p-3 font-semibold">{formatTime(period.start_time)}<span className="block font-normal text-slate-400">{formatTime(period.end_time)}</span></td>
          {weekDays.map(value=>{const day=new Date(`${value}T12:00:00`).getDay();const assignment=data.assignments.find(item=>item.period_id===period.id&&(item.weekday===day||item.weekday===null));const cls=data.classes.find(c=>c.id===assignment?.class_id);return <td key={value} className="p-1">{period.kind==='break'?<div className="rounded-lg bg-amber-50 p-3 text-center text-amber-700 dark:bg-amber-950/40">{period.name}</div>:assignment?<Link href={`/teacher/timetable/${assignment.id}?date=${value}`} className={`block rounded-lg p-2 text-center ${tones[periodIndex%tones.length]}`}><b className="block">{filter==='subject'?assignment.subject:classLabel(cls)}</b><span>{filter==='subject'?classLabel(cls):assignment.subject}</span></Link>:<div className="rounded-lg bg-slate-50 p-3 text-center text-slate-400 dark:bg-slate-900">Free</div>}</td>})}
        </tr>)}</tbody></table></div>
    </>}
  </div></Shell>;
}

function DateControl({date,setDate}:{date:string;setDate:(value:string)=>void}) {
  return <div className="flex gap-2"><button aria-label="Previous day" onClick={()=>setDate(addDays(date,-1))} className={`${card} p-3`}><ChevronLeft/></button><label className={`${card} flex min-w-0 flex-1 items-center gap-3 px-4 py-2`}><CalendarDays className="h-5 w-5 text-blue-600"/><input aria-label="Selected date" type="date" value={date} onChange={event=>setDate(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"/></label><button aria-label="Next day" onClick={()=>setDate(addDays(date,1))} className={`${card} p-3`}><ChevronRight/></button></div>;
}
function Summary({icon:Icon,value,label,tone}:{icon:typeof BookOpen;value:number;label:string;tone:'blue'|'green'|'violet'|'amber'}) {
  const colors={blue:'bg-blue-50 text-blue-600 dark:bg-blue-950/40',green:'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40',violet:'bg-violet-50 text-violet-600 dark:bg-violet-950/40',amber:'bg-amber-50 text-amber-600 dark:bg-amber-950/40'};
  return <div className={`rounded-2xl p-3 text-center ${colors[tone]}`}><Icon className="mx-auto h-5 w-5"/><b className="mt-1 block text-xl text-slate-950 dark:text-white">{value}</b><span className="text-[11px] text-slate-600 dark:text-slate-300">{label}</span></div>;
}
function ScheduleRow({item,date,cls,tone}:{item:Entry;date:string;cls?:ClassRow;tone:string}) {
  const {period,assignment}=item;
  if(period.kind==='break'||!assignment) return <div className={`grid grid-cols-[72px_1fr] items-center gap-2 rounded-2xl border border-slate-200 p-2 dark:border-slate-800 ${period.kind==='break'?'bg-amber-50 dark:bg-amber-950/30':'bg-slate-50 dark:bg-slate-900'}`}><Time period={period}/><div className="flex items-center gap-3"><Coffee className="h-5 w-5 text-amber-500"/><div><b>{period.kind==='break'?period.name:'Free Period'}</b><p className="text-xs text-slate-500">{period.kind==='break'?'Break':'Preparation / planning'}</p></div></div></div>;
  const status=statusFor(date,period.start_time,period.end_time);
  return <Link href={`/teacher/timetable/${assignment.id}?date=${date}`} className="grid grid-cols-[72px_1fr_auto] items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950"><Time period={period}/><div className="flex min-w-0 items-center gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}><BookOpen className="h-5 w-5"/></span><div className="min-w-0"><b className="block truncate">{classLabel(cls)}</b><p className="truncate text-xs text-slate-500">{assignment.subject}</p></div></div><div className="flex items-center gap-1"><span className={`rounded-full px-2 py-1 text-[11px] font-medium ${status==='Now'?'bg-blue-100 text-blue-700':status==='Completed'?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{status}</span><ChevronRight className="h-4 w-4 text-slate-400"/></div></Link>;
}
function Time({period}:{period:Period}) { return <div className="text-center text-xs"><b className="block">{formatTime(period.start_time)}</b><span className="text-slate-400">{formatTime(period.end_time)}</span></div>; }
function Empty({title,body}:{title:string;body:string}) { return <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><CalendarDays className="mx-auto h-8 w-8 text-amber-500"/><b className="mt-3 block">{title}</b><p className="mt-1 text-sm text-slate-500">{body}</p></div>; }
function FilterButton({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}) { return <button onClick={onClick} className={`py-3 text-sm font-semibold ${active?'border-b-2 border-blue-600 text-blue-600':'text-slate-500'}`}>{children}</button>; }
function Shell({children}:{children:React.ReactNode}) { return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Sidebar/><div className="min-h-screen pt-10 lg:ml-64"><TopBar/><main className="px-4 pb-24 pt-24 sm:px-6 lg:px-8">{children}</main></div></div>; }
