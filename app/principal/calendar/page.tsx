'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, FileText, GraduationCap, MapPin, Pencil, Plus, Layers3, Trash2, TreePalm, UsersRound, X } from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';
import { formatEventTime, nepalDay } from '@/lib/upcoming';

type Category = 'event' | 'exam' | 'meeting' | 'holiday';
type Filter = 'all' | Category;
type CalendarEvent = { id:string; school_id:string; title:string; event_date:string|null; end_date:string|null; event_time:string|null; end_time:string|null; all_day:boolean; content:string|null; location:string|null; category:string|null; audience:string|null; class_targets:string[]|null; created_by:string|null; created_at:string|null };
type Exam = { id:string; name:string; start_date:string|null; end_date:string|null; exam_type:string|null };
type Class = { id:string; class_number:string|null; class:string|null; class_name:string|null; section_name:string|null; section:string|null };
type ExamClass = { exam_id:string; class_name:string; section:string };
type Item = { id:string; source:'event'|'exam'; sourceId:string; title:string; type:Category; start:string; end:string; startTime:string|null; endTime:string|null; allDay:boolean; description:string|null; location:string|null; audience:string|null; classes:string[]; createdBy:string|null };
type Form = { title:string; type:Category; date:string; endDate:string; startTime:string; endTime:string; allDay:boolean; description:string; location:string; audience:'public'|'school'|'classes'; classes:string[] };
const emptyForm:Form = { title:'',type:'event',date:'',endDate:'',startTime:'',endTime:'',allDay:true,description:'',location:'',audience:'public',classes:[] };
const types:{value:Filter;label:string;icon:React.ElementType|null;style:string;active:string}[] = [
  {value:'all',label:'All',icon:null,style:'border-blue-100 bg-blue-50 text-blue-700',active:'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200'},
  {value:'event',label:'Event',icon:CalendarDays,style:'border-blue-200 bg-blue-50 text-blue-700',active:'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200'},
  {value:'exam',label:'Exam',icon:GraduationCap,style:'border-lime-300 bg-lime-50 text-lime-700',active:'border-lime-500 bg-lime-500 text-slate-950 shadow-sm shadow-lime-200'},
  {value:'meeting',label:'Meeting',icon:UsersRound,style:'border-violet-300 bg-violet-50 text-violet-700',active:'border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-200'},
  {value:'holiday',label:'Holiday',icon:TreePalm,style:'border-[#DC143C]/30 bg-[#FFF0F3] text-[#DC143C]',active:'border-[#DC143C] bg-[#DC143C] text-white shadow-sm shadow-red-200'},
];
const color:Record<Category,{dot:string;badge:string;box:string}> = {
  event:{dot:'bg-blue-600',badge:'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',box:'border border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'},
  exam:{dot:'bg-lime-500',badge:'bg-lime-50 text-lime-700 dark:bg-lime-950 dark:text-lime-300',box:'border border-lime-300 bg-lime-50 text-lime-700 dark:border-lime-800 dark:bg-lime-950 dark:text-lime-300'},
  meeting:{dot:'bg-violet-600',badge:'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',box:'border border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300'},
  holiday:{dot:'bg-[#DC143C]',badge:'bg-[#FFF0F3] text-[#DC143C] dark:bg-red-950 dark:text-red-300',box:'border border-[#DC143C]/30 bg-[#FFF0F3] text-[#DC143C] dark:border-red-800 dark:bg-red-950 dark:text-red-300'},
};
const normalize=(value:string|null):Category=>value==='exam'||value==='meeting'||value==='holiday'?value:'event';
const classKey=(name:string,section:string)=>`${name}::${section}`;
const classLabel=(value:string)=>{const [name,section]=value.split('::');return `Class ${name}${section?` (${section})`:''}`;};
const formatDate=(date:string)=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T00:00:00Z`));
const nextDate=(date:string,offset:number)=>{const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);};
const monthOffset=(month:string,offset:number)=>{const [year,m]=month.split('-').map(Number);return new Date(Date.UTC(year,m-1+offset,1)).toISOString().slice(0,7);};
const timeLabel=(item:Item)=>`${formatEventTime(item.startTime)||'Time not set'}${item.endTime?` – ${formatEventTime(item.endTime)}`:''}`;
const relativeDateLabel=(item:Item,today:string)=>{if(item.start<=today&&item.end>=today)return item.start===today?'Today':'Ongoing';const start=new Date(`${item.start}T00:00:00Z`).getTime();const current=new Date(`${today}T00:00:00Z`).getTime();const days=Math.round((start-current)/86400000);if(days===1)return'Tomorrow';if(days>1)return`${days} days left`;if(days===-1)return'Yesterday';return`${Math.abs(days)} days ago`;};
const dateBox=(date:string)=>({month:new Intl.DateTimeFormat('en-US',{month:'short',timeZone:'UTC'}).format(new Date(`${date}T00:00:00Z`)).toUpperCase(),day:Number(date.slice(-2))});
const inputClass='mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

export default function CalendarPage(){
  const today=nepalDay();
  const [month,setMonth]=useState(today.slice(0,7));
  const [day,setDay]=useState(today);
  const [filter,setFilter]=useState<Filter>('all');
  const [schoolId,setSchoolId]=useState('');
  const [userId,setUserId]=useState('');
  const [events,setEvents]=useState<CalendarEvent[]>([]);
  const [exams,setExams]=useState<Exam[]>([]);
  const [examClasses,setExamClasses]=useState<ExamClass[]>([]);
  const [classes,setClasses]=useState<Class[]>([]);
  const [creatorNames,setCreatorNames]=useState<Record<string,string>>({});
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [form,setForm]=useState<Form>(emptyForm);
  const [formOpen,setFormOpen]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(false);
  const [showAll,setShowAll]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [reload,setReload]=useState(0);

  useEffect(()=>{let active=true;async function load(){setLoading(true);setError('');try{
    const {data:{user},error:authError}=await supabase.auth.getUser();
    if(authError)throw authError;
    if(!user)throw new Error('Sign in as principal to view the school calendar.');
    const {data:profile,error:profileError}=await supabase.from('profiles').select('school_id,role').eq('user_id',user.id).single();
    if(profileError||!profile?.school_id||!['admin','principal','school_admin'].includes(profile.role))throw new Error('Your principal school profile could not be loaded.');
    const school=profile.school_id;
    const [eventResult,examResult,classResult,examClassResult]=await Promise.all([
      supabase.from('news_events').select('id,school_id,title,event_date,end_date,event_time,end_time,all_day,content,location,category,audience,class_targets,created_by,created_at').eq('school_id',school).eq('is_event',true).order('event_date',{ascending:true}),
      supabase.from('exams').select('id,name,start_date,end_date,exam_type').eq('school_id',school).order('start_date',{ascending:true}),
      supabase.from('classes').select('id,class_number,class,class_name,section_name,section').eq('school_id',school).is('archived_at',null),
      supabase.from('exam_subjects').select('exam_id,class_name,section').eq('school_id',school),
    ]);
    const failure=[eventResult,examResult,classResult,examClassResult].find(result=>result.error)?.error;
    if(failure)throw failure;
    const records=(eventResult.data||[]) as CalendarEvent[];
    const ids=[...new Set(records.map(event=>event.created_by).filter((id):id is string=>Boolean(id)))];
    const names:Record<string,string>={};
    if(ids.length){const {data:profiles}=await supabase.from('profiles').select('user_id,full_name').eq('school_id',school).in('user_id',ids);for(const p of profiles||[])if(p.user_id&&p.full_name)names[p.user_id]=p.full_name;}
    if(!active)return;
    setSchoolId(school);setUserId(user.id);setEvents(records);setExams((examResult.data||[]) as Exam[]);setClasses((classResult.data||[]) as Class[]);setExamClasses((examClassResult.data||[]) as ExamClass[]);setCreatorNames(names);
    const params=new URLSearchParams(window.location.search);
    const id=params.get('event');
    if(id&&records.some(event=>event.id===id)){setSelectedId(`event-${id}`);const event=records.find(item=>item.id===id);if(event?.event_date){setMonth(event.event_date.slice(0,7));setDay(event.event_date);}}
    else if(params.get('action')==='create'){setForm({...emptyForm,date:nepalDay(),endDate:nepalDay()});setEditingId(null);setFormOpen(true);window.history.replaceState(window.history.state,'',window.location.pathname);}
  }catch(cause){if(active)setError(cause instanceof Error?cause.message:'Calendar could not be loaded.');}finally{if(active)setLoading(false);}}load();return()=>{active=false;};},[reload]);

  const availableClasses=useMemo(()=>[...new Set(classes.map(c=>classKey(c.class_number||c.class||c.class_name||'',c.section_name||c.section||'')).filter(value=>value.split('::')[0]))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),[classes]);
  const allItems=useMemo<Item[]>(()=>[
    ...events.filter(event=>event.event_date).map(event=>({id:`event-${event.id}`,source:'event' as const,sourceId:event.id,title:event.title,type:normalize(event.category),start:event.event_date!,end:event.end_date&&event.end_date>=event.event_date!?event.end_date:event.event_date!,startTime:event.event_time,endTime:event.end_time,allDay:Boolean(event.all_day)||!event.event_time,description:event.content,location:event.location,audience:event.audience,classes:event.class_targets||[],createdBy:event.created_by?creatorNames[event.created_by]||null:null})),
    ...exams.filter(exam=>exam.start_date).map(exam=>({id:`exam-${exam.id}`,source:'exam' as const,sourceId:exam.id,title:exam.name,type:'exam' as const,start:exam.start_date!,end:exam.end_date&&exam.end_date>=exam.start_date!?exam.end_date:exam.start_date!,startTime:null,endTime:null,allDay:true,description:exam.exam_type,location:null,audience:'school',classes:[...new Set(examClasses.filter(row=>row.exam_id===exam.id).map(row=>classKey(row.class_name,row.section)))],createdBy:null})),
  ].sort((a,b)=>a.start.localeCompare(b.start)||(a.startTime||'').localeCompare(b.startTime||'')||a.title.localeCompare(b.title)),[events,exams,examClasses,creatorNames]);
  const visible=allItems.filter(item=>filter==='all'||item.type===filter);
  const upcoming=visible.filter(item=>item.end>=today);
  const selected=allItems.find(item=>item.id===selectedId)||null;
  const selectedDayItems=visible.filter(item=>item.start<=day&&item.end>=day);
  const related=selected?visible.filter(item=>item.id!==selected.id&&item.start>=selected.start&&item.start<=nextDate(selected.end,7)).slice(0,3):[];
  const [year,monthNumber]=month.split('-').map(Number);
  const firstWeekday=new Date(Date.UTC(year,monthNumber-1,1)).getUTCDay();
  const daysInMonth=new Date(Date.UTC(year,monthNumber,0)).getUTCDate();
  const totalCells=Math.ceil((firstWeekday+daysInMonth)/7)*7;
  const firstDate=`${month}-01`;
  const cells=Array.from({length:totalCells},(_,index)=>nextDate(firstDate,index-firstWeekday));
  const monthDates=Array.from({length:daysInMonth},(_,index)=>nextDate(firstDate,index));
  const weekendDates=monthDates.filter(date=>{const weekday=new Date(`${date}T00:00:00Z`).getUTCDay();return weekday===0||weekday===6;});
  const explicitHolidays=allItems.filter(item=>item.type==='holiday'&&item.start.slice(0,7)===month);
  const defaultWeekendHolidayCount=weekendDates.filter(date=>!explicitHolidays.some(item=>item.start<=date&&item.end>=date)).length;
  const monthTitle=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${firstDate}T00:00:00Z`));
  const typeCounts={event:allItems.filter(item=>item.type==='event'&&item.start.slice(0,7)===month).length,exam:allItems.filter(item=>item.type==='exam'&&item.start.slice(0,7)===month).length,meeting:allItems.filter(item=>item.type==='meeting'&&item.start.slice(0,7)===month).length,holiday:explicitHolidays.length+defaultWeekendHolidayCount};

  function selectDate(date:string){setDay(date);if(date.slice(0,7)!==month)setMonth(date.slice(0,7));}
  function openForm(event?:CalendarEvent){setSelectedId(null);setEditingId(event?.id||null);setForm(event?{title:event.title,type:normalize(event.category),date:event.event_date||today,endDate:event.end_date||event.event_date||today,startTime:event.event_time?.slice(0,5)||'',endTime:event.end_time?.slice(0,5)||'',allDay:Boolean(event.all_day)||!event.event_time,description:event.content||'',location:event.location||'',audience:event.audience==='school'||event.audience==='classes'?event.audience:'public',classes:event.class_targets||[]}:{...emptyForm,date:day,endDate:day});setFormOpen(true);setError('');setNotice('');}
  async function saveEvent(e:FormEvent){e.preventDefault();if(!schoolId)return;
    if(!form.title.trim()||!form.date||form.endDate<form.date||(!form.allDay&&(!form.startTime||(form.endDate===form.date&&form.endTime&&form.endTime<=form.startTime)))||(form.audience==='classes'&&!form.classes.length)){setError('Check the title, dates, times and selected classes.');return;}
    if(form.type==='exam'&&exams.some(exam=>exam.start_date===form.date&&exam.name.trim().toLowerCase()===form.title.trim().toLowerCase())){setError('This exam already appears automatically from Exams & Results.');return;}
    setSaving(true);setError('');setNotice('');
    const payload={school_id:schoolId,title:form.title.trim(),event_date:form.date,end_date:form.endDate||form.date,event_time:form.allDay?null:form.startTime,end_time:form.allDay?null:form.endTime||null,all_day:form.allDay,content:form.description.trim()||null,location:form.location.trim()||null,category:form.type,audience:form.audience,class_targets:form.audience==='classes'?form.classes:[],is_event:true,...(!editingId?{created_by:userId}:{})};
    const result=editingId?await supabase.from('news_events').update(payload).eq('id',editingId).eq('school_id',schoolId).eq('is_event',true):await supabase.from('news_events').insert(payload);
    setSaving(false);if(result.error){setError(result.error.message);return;}
    setFormOpen(false);setMonth(form.date.slice(0,7));setDay(form.date);setNotice(editingId?'Event updated.':'Event added.');setReload(value=>value+1);
  }
  async function deleteEvent(){if(!selected||!schoolId)return;setSaving(true);setError('');if(selected.source==='exam'){const {data:deleted,error:deleteError}=await supabase.from('exams').delete().eq('id',selected.sourceId).eq('school_id',schoolId).select('id');setSaving(false);if(deleteError){setConfirmDelete(false);setError(deleteError.message);return;}if(!deleted?.length){setConfirmDelete(false);setError('This published exam cannot be deleted from the calendar because it may contain marks. Open Exams & Results to manage it safely.');return;}setConfirmDelete(false);setSelectedId(null);setNotice('Exam deleted.');setReload(value=>value+1);return;}const {error:deleteError}=await supabase.from('news_events').delete().eq('id',selected.sourceId).eq('school_id',schoolId).eq('is_event',true);setSaving(false);setConfirmDelete(false);if(deleteError){setError(deleteError.message);return;}setSelectedId(null);setNotice('Event deleted.');setReload(value=>value+1);}

  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"><Sidebar/><div className="flex min-h-screen flex-col pt-14 lg:ml-64 lg:pt-0"><div className="hidden lg:block"><TopBar/></div><main className="flex-1 px-3 pb-24 pt-0 sm:px-6 sm:pt-6 lg:px-8 lg:pt-24"><div className="mx-auto max-w-6xl">
    <header className="-mx-3 w-[calc(100%+1.5rem)] rounded-none border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 px-3 py-3 dark:border-blue-900 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950 sm:mx-0 sm:w-full sm:rounded-xl sm:border-x sm:border-b sm:px-5 sm:py-4"><div className="flex items-center justify-between gap-2.5"><div className="flex min-w-0 items-center gap-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 sm:h-10 sm:w-10"><span role="img" aria-label="Calendar" className="text-xl leading-none sm:text-2xl">🗓️</span></span><div className="min-w-0"><h1 className="truncate text-lg font-extrabold sm:text-3xl">School Calendar</h1><p className="mt-0.5 text-[10px] leading-4 text-slate-600 dark:text-slate-300 sm:text-sm">Events, meetings, holidays and exams from your school.</p></div></div><button onClick={()=>openForm()} disabled={!schoolId} className="flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[11px] font-bold text-white shadow-sm disabled:opacity-50 sm:h-10 sm:px-4 sm:text-sm"><Plus className="h-4 w-4"/>Add Event</button></div></header>
    {error&&<p role="alert" className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">{error}</p>}{notice&&<p role="status" className="mt-2 rounded-xl bg-emerald-50 p-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{notice}</p>}
    <nav aria-label="Calendar filters" className="mt-3 grid w-full grid-cols-[0.72fr_1.08fr_1fr_1.22fr_1.18fr] gap-1.5">{types.map(({value,label,icon:Icon,style,active})=><button key={value} onClick={()=>setFilter(value)} aria-pressed={filter===value} className={`flex h-11 min-w-0 items-center justify-center gap-1 rounded-xl border px-1 text-[10px] font-extrabold transition-colors sm:h-12 sm:gap-2 sm:px-3 sm:text-sm ${filter===value?active:style}`}>{Icon&&<Icon fill={value==='exam'||value==='meeting'||value==='holiday'?'currentColor':'none'} strokeWidth={value==='exam'||value==='meeting'||value==='holiday'?1.6:2} className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"/>}<span className="truncate">{label}</span></button>)}</nav>
    {loading?<div className="mt-3 animate-pulse rounded-xl bg-white p-5 text-sm text-slate-500 dark:bg-slate-900">Loading calendar…</div>:<><section className="mt-3 overflow-hidden bg-white dark:bg-slate-900 sm:rounded-xl sm:border sm:border-slate-200 sm:shadow-sm sm:dark:border-slate-800" aria-label="Monthly calendar"><div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center border-b border-slate-100 px-3 py-3 dark:border-slate-800 sm:grid-cols-[52px_minmax(0,1fr)_52px] sm:px-5 sm:py-4"><button onClick={()=>setMonth(monthOffset(month,-1))} aria-label="Previous month" className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900 sm:h-12 sm:w-12"><ChevronLeft className="h-6 w-6"/></button><h2 className="truncate px-2 text-center text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">{monthTitle}</h2><button onClick={()=>setMonth(monthOffset(month,1))} aria-label="Next month" className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900 sm:h-12 sm:w-12"><ChevronRight className="h-6 w-6"/></button></div><div className="grid grid-cols-7 bg-slate-50 text-center text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400 sm:text-[10px]">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((label,index)=><span key={label} className={`py-1.5 sm:py-2 ${index===0||index===6?'text-rose-600 dark:text-rose-400':''}`}>{label}</span>)}</div><div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800">{cells.map(date=>{const entries=visible.filter(item=>item.start<=date&&item.end>=date);const weekday=new Date(`${date}T00:00:00Z`).getUTCDay();const weekend=weekday===0||weekday===6;const entryTypes=new Set(entries.map(item=>item.type));const cellTypes=[...new Set<Category>([...(weekend?['holiday' as const]:[]),...entryTypes])];const dateType:Category|null=cellTypes.includes('holiday')?'holiday':cellTypes.includes('exam')?'exam':cellTypes.includes('meeting')?'meeting':cellTypes.includes('event')?'event':null;const filteredCellBackground=filter==='event'&&entries.length?'bg-blue-200 dark:bg-blue-900/80':filter==='exam'&&entries.length?'bg-lime-200 dark:bg-lime-900/80':filter==='meeting'&&entries.length?'bg-violet-200 dark:bg-violet-900/80':filter==='holiday'&&(entries.length||weekend)?'bg-[#FFD1DB] dark:bg-red-900/80':'bg-white dark:bg-slate-900';const dateColor=dateType==='holiday'?'text-[#DC143C] dark:text-red-300':dateType==='exam'?'text-lime-600 dark:text-lime-300':dateType==='meeting'?'text-violet-700 dark:text-violet-300':dateType==='event'?'text-blue-700 dark:text-blue-300':'';const todayColor=dateType==='holiday'?'bg-[#DC143C] text-white':dateType==='exam'?'bg-lime-500 text-slate-950':dateType==='meeting'?'bg-violet-600 text-white':dateType==='event'?'bg-blue-600 text-white':'bg-blue-600 text-white';return <button key={date} onClick={()=>selectDate(date)} aria-label={`${formatDate(date)}, ${entries.length} events${weekend?', school holiday':''}`} aria-pressed={day===date} className={`relative flex min-h-11 ${filteredCellBackground} flex-col items-center justify-start px-0.5 py-1 transition-[filter] hover:brightness-[0.98] sm:min-h-16 sm:py-1.5 ${date.slice(0,7)!==month?'text-slate-300 dark:text-slate-600':''} ${day===date?'z-10 bg-blue-50/80 ring-2 ring-inset ring-blue-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] dark:bg-blue-950/30':''}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold sm:h-8 sm:w-8 sm:text-sm ${date===today?todayColor:dateColor|| (day===date?'text-blue-700 dark:text-blue-300':'')}`}>{Number(date.slice(-2))}</span>{entries.length>1&&<span className="mt-0.5 flex h-1.5 max-w-full items-center justify-center gap-0.5" aria-hidden="true">{entries.slice(0,5).map((entry,index)=><i key={`${entry.id}-${index}`} className={`h-1.5 w-1.5 shrink-0 rounded-full ${color[entry.type].dot}`}/>)}</span>}</button>;})}</div><div className="grid grid-cols-4 gap-1 border-t border-slate-100 p-1.5 text-[11px] font-bold dark:border-slate-800 sm:p-2 sm:text-xs">{(['event','exam','meeting','holiday'] as const).map(type=><span key={type} className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-1.5 ${color[type].box}`}><i className={`h-2 w-2 shrink-0 rounded-full ${color[type].dot}`}/><span className="truncate">{type[0].toUpperCase()+type.slice(1)}</span><strong>{typeCounts[type]}</strong></span>)}</div></section>
    <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-sm font-bold">{day===today?'Today':formatDate(day)}</h2>{selectedDayItems.length?<div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">{selectedDayItems.map(item=><EventRow key={item.id} item={item} onClick={()=>setSelectedId(item.id)}/>)}</div>:<p className="mt-1 text-xs text-slate-500">No {filter==='all'?'events':filter} on this date.</p>}</section>
    <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between gap-2"><div><h2 className="text-base font-bold">Upcoming Events</h2><p className="mt-0.5 text-xs text-slate-500">School events and exam start dates.</p></div>{upcoming.length>3&&<button onClick={()=>setShowAll(value=>!value)} className="shrink-0 text-xs font-semibold text-blue-600">{showAll?'Show less':'View all'}</button>}</div>{upcoming.length?<div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">{(showAll?upcoming:upcoming.slice(0,3)).map(item=><EventRow key={item.id} item={item} onClick={()=>setSelectedId(item.id)}/>)}</div>:<p className="mt-3 rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500 dark:bg-slate-800">No upcoming events for this filter.</p>}</section></>}
  </div></main></div>
  {selected&&<div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedId(null);}}>
    <div role="dialog" aria-modal="true" aria-label="Event details" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-slate-950 shadow-xl sm:rounded-2xl sm:p-4">
      <div className="relative flex min-h-9 items-center justify-center">
        <h2 className="text-center text-lg font-extrabold">Event Details</h2>
        <button onClick={()=>setSelectedId(null)} aria-label="Close details" className="absolute right-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"><X className="h-5 w-5"/></button>
      </div>
      <section className="mt-3 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-white p-3.5">
        <div className="flex items-center gap-3">
          <LargeDateBox date={selected.start} type={selected.type}/>
          <div className="h-14 w-px shrink-0 bg-blue-200"/>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold leading-tight sm:text-lg">{selected.title}</h3>
            <div className="mt-1"><Badge type={selected.type}/></div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 divide-x divide-blue-200 border-t border-blue-100 pt-3">
          <EventMeta icon={CalendarDays} label="Date" value={selected.end!==selected.start?`${formatDate(selected.start)} – ${formatDate(selected.end)}`:formatDate(selected.start)}/>
          <EventMeta icon={UsersRound} label="Audience" value={selected.classes.length?selected.classes.map(classLabel).join(', '):selected.audience==='school'?'Whole school':selected.audience==='public'?'Public':'Not specified'}/>
          <EventMeta icon={FileText} label="Created by" value={selected.source==='exam'?'Exams & Results':selected.createdBy||'Not recorded'}/>
        </div>
        {!selected.allDay&&<p className="mt-3 flex items-center justify-center gap-1.5 border-t border-blue-100 pt-2 text-[11px] font-semibold text-slate-600"><Clock3 className="h-3.5 w-3.5 text-blue-600"/>{timeLabel(selected)}</p>}
      </section>
      {(selected.description||selected.location)&&<section className="mt-3 flex gap-3 rounded-2xl border border-blue-200 bg-white p-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><FileText className="h-4 w-4"/></span>
        <div className="min-w-0"><h3 className="text-sm font-extrabold">Description</h3><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">{selected.description||selected.location}</p></div>
      </section>}
      <div className="mt-3 flex gap-2">{selected.source==='event'?<><button onClick={()=>openForm(events.find(event=>event.id===selected.sourceId))} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-blue-600 bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"><Pencil className="h-4 w-4"/>Edit Event</button><button onClick={()=>setConfirmDelete(true)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-rose-300 bg-white py-2.5 text-xs font-bold text-rose-600"><Trash2 className="h-4 w-4"/>Delete Event</button></>:<><a href={`/principal/results?exam=${encodeURIComponent(selected.sourceId)}`} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white"><GraduationCap className="h-4 w-4"/>Open Exam</a><button onClick={()=>setConfirmDelete(true)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-rose-300 bg-white py-2.5 text-xs font-bold text-rose-600"><Trash2 className="h-4 w-4"/>Delete Exam</button></>}</div>
      {related.length>0&&<section className="mt-3 rounded-xl border border-slate-200 bg-white p-3"><h3 className="text-sm font-bold">Related Events</h3><div className="mt-1 divide-y divide-slate-100">{related.map(item=><EventRow key={item.id} item={item} onClick={()=>setSelectedId(item.id)}/>)}</div></section>}
    </div>
  </div>}
  {confirmDelete&&selected&&<div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4"><div role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-xl bg-white p-4 dark:bg-slate-900"><h2 className="font-bold">Delete this {selected.source==='exam'?'exam':'event'}?</h2><p className="mt-2 text-sm text-slate-500">{selected.source==='exam'?`${selected.title} and its related subjects and marks will be permanently removed.`:`${selected.title} will be removed from the school calendar.`}</p><div className="mt-4 flex gap-2"><button onClick={()=>setConfirmDelete(false)} disabled={saving} className="flex-1 rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">Cancel</button><button onClick={deleteEvent} disabled={saving} className="flex-1 rounded-lg bg-rose-600 p-2 text-sm font-bold text-white disabled:opacity-50">{saving?'Deleting…':'Delete'}</button></div></div></div>}
  {formOpen&&<div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setFormOpen(false);}}>
    <div role="dialog" aria-modal="true" aria-label={editingId?'Edit Event':'Add Event'} className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-xl bg-white text-slate-950 shadow-2xl [color-scheme:light] sm:rounded-2xl">
      <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 px-4 pb-2.5 pt-2.5">
        <div className="pointer-events-none absolute -bottom-12 left-[38%] h-28 w-[72%] rotate-[-8deg] rounded-[50%] bg-blue-200/45"/>
        <div className="pointer-events-none absolute -bottom-14 right-[-8%] h-28 w-[58%] rotate-[9deg] rounded-[50%] bg-blue-300/35"/>
        <div className="relative flex items-center justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">{editingId?'Edit Event':'Add Event'}</h2>
          <button type="button" onClick={()=>setFormOpen(false)} aria-label="Close form" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-950 transition hover:bg-white/70"><X className="h-5 w-5"/></button>
        </div>
      </div>
      <form id="calendar-form" onSubmit={saveEvent} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 text-xs font-bold text-slate-800 sm:px-6">
        {error&&<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <label className="block">
          <span className="flex items-center gap-2"><i className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Pencil className="h-4 w-4"/></i><span>Title <b className="text-rose-600">*</b></span></span>
          <input required maxLength={160} placeholder="Enter event title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={inputClass}/>
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="min-w-0">
            <span className="flex items-center gap-2"><i className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Layers3 className="h-4 w-4"/></i><span>Type</span></span>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value as Category}))} className={inputClass}>{(['event','exam','meeting','holiday'] as const).map(type=><option key={type} value={type}>{type[0].toUpperCase()+type.slice(1)}</option>)}</select>
          </label>
          <label className="min-w-0">
            <span className="flex items-center gap-2"><i className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><UsersRound className="h-4 w-4"/></i><span>Audience</span></span>
            <select value={form.audience} onChange={e=>setForm(f=>({...f,audience:e.target.value as Form['audience']}))} className={inputClass}><option value="public">Public</option><option value="school">Whole school</option><option value="classes">Selected classes</option></select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="min-w-0">
            <span className="flex items-center gap-2"><i className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><CalendarDays className="h-4 w-4"/></i><span>Start date</span></span>
            <input required type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value,endDate:f.endDate&&f.endDate>=e.target.value?f.endDate:e.target.value}))} className={inputClass}/>
          </label>
          <label className="min-w-0">
            <span className="flex items-center gap-2"><i className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><CalendarDays className="h-4 w-4"/></i><span>End date</span></span>
            <input required type="date" min={form.date} value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} className={inputClass}/>
          </label>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-sky-50 px-3 py-2 text-sm">
          <input type="checkbox" checked={form.allDay} onChange={e=>setForm(f=>({...f,allDay:e.target.checked}))} className="h-5 w-5 rounded border-blue-300 accent-blue-600"/>
          <span>All day</span>
        </label>
        {!form.allDay&&<div className="grid grid-cols-2 gap-2.5">
          <label><span className="flex items-center gap-2"><i className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Clock3 className="h-4 w-4"/></i>Start time</span><input required type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))} className={inputClass}/></label>
          <label><span className="flex items-center gap-2"><i className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Clock3 className="h-4 w-4"/></i>End time</span><input type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))} className={inputClass}/></label>
        </div>}
        {form.audience==='classes'&&<fieldset><legend className="flex items-center gap-2"><i className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><UsersRound className="h-4 w-4"/></i>Classes</legend><div className="mt-2 grid max-h-32 grid-cols-2 gap-2 overflow-auto rounded-xl border border-slate-200 p-3">{availableClasses.map(value=><label key={value} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.classes.includes(value)} onChange={e=>setForm(f=>({...f,classes:e.target.checked?[...f.classes,value]:f.classes.filter(item=>item!==value)}))} className="accent-blue-600"/>{classLabel(value)}</label>)}</div></fieldset>}
        <label className="block">
          <span className="flex items-center gap-2"><i className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><FileText className="h-4 w-4"/></i><span>Description</span></span>
          <textarea rows={3} placeholder="Add details, location or instructions (optional)" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className={inputClass}/>
        </label>
      </form>
      <div className="shrink-0 border-t border-blue-100 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-6 sm:pb-5">
        <button form="calendar-form" disabled={saving} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-50">{saving?'Saving…':editingId?'Save changes':'Add Event'}</button>
      </div>
    </div>
  </div>}
  </div>;
}
function LargeDateBox({date,type}:{date:string;type:Category}){const {month,day}=dateBox(date);return <span className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl ${color[type].box}`}><span className="text-xs font-extrabold">{month}</span><span className="text-2xl font-black leading-none">{day}</span></span>;}
function EventMeta({icon:Icon,label,value}:{icon:React.ElementType;label:string;value:string}){return <div className="flex min-w-0 gap-1.5 px-2 first:pl-0 last:pr-0"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"/><div className="min-w-0"><p className="text-[9px] font-medium text-slate-500">{label}</p><p className="mt-0.5 line-clamp-2 text-[10px] font-bold leading-3 text-slate-900 sm:text-xs sm:leading-4">{value}</p></div></div>;}
function DateBox({date,type}:{date:string;type:Category}){const {month,day}=dateBox(date);return <span className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${color[type].box}`}><span className="text-[10px] font-bold">{month}</span><span className="text-lg font-extrabold leading-tight">{day}</span></span>;}
function Badge({type}:{type:Category}){return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${color[type].badge}`}>{type[0].toUpperCase()+type.slice(1)}</span>;}
function EventRow({item,onClick}:{item:Item;onClick:()=>void}){return <button onClick={onClick} className="flex w-full items-center gap-2.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"><DateBox date={item.start} type={item.type}/><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="truncate text-xs sm:text-sm">{item.title}</strong><Badge type={item.type}/></span><span className="mt-0.5 block text-[11px] text-slate-500">{relativeDateLabel(item,nepalDay())}{!item.allDay?` · ${timeLabel(item)}`:''}{item.end!==item.start?` · until ${formatDate(item.end)}`:''}</span><span className="block truncate text-[11px] text-slate-500">{item.classes.length?item.classes.map(classLabel).join(', '):item.location||((item.audience==='school'||item.source==='exam')?'Whole school':item.audience==='public'?'Public':'')}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-slate-400"/></button>;}
function Detail({icon:Icon,title,children}:{icon:React.ElementType;title:string;children:React.ReactNode}){return <section className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><span className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950"><Icon className="h-4 w-4"/></span><div><h3 className="text-xs font-bold">{title}</h3><p className="mt-1 whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-300">{children}</p></div></section>;}
