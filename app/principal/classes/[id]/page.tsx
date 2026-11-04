"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  ChevronRight,
  Clock3,
  GraduationCap,
  Layers3,
  Plus,
  UserRoundPlus,
  Users,
  Zap,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase";
import { nepalDay } from "@/lib/upcoming";

type Tab = "overview" | "students" | "teachers" | "sections";
type ClassRow = {
  id:string; school_id:string; class_name:string|null; class:string|null; name:string|null;
  class_number:string|null; section:string|null; section_name:string|null; teacher_id:string|null;
  academic_year:number; archived_at:string|null;
};
type Student = { id:string; name:string; class:string|null; section:string|null; created_at:string|null };
type Teacher = { id:string; name:string; subject:string|null; avatar_path:string|null };
type TeacherAssignment = {
  id:string; teacher_id:string; class_id:string|null; class_name:string|null; subject:string|null;
  active:boolean|null; created_at:string|null;
};
type Attendance = { status:string|null; attendance_date:string; class_name:string|null; section:string|null };
type CachedClassDetails = {
  baseRow:ClassRow; rows:ClassRow[]; students:Student[]; teachers:Teacher[];
  assignments:TeacherAssignment[]; attendance:Attendance[];
};
const classDetailsCache=new Map<string,CachedClassDetails>();

const norm=(value:string|null|undefined)=>(value||"").trim().toLowerCase().replace(/^(class|grade)\s+/,"");
const rawClass=(row:ClassRow)=>row.class_name||row.class||row.name||row.class_number||"Class";
const sectionName=(row:ClassRow)=>(row.section_name||row.section||"").trim();
const displayClass=(value:string)=>{const plain=value.trim().replace(/^(class|grade)\s+/i,"");return /^\d+$/.test(plain)?`Grade ${plain}`:value;};
const firstName=(value:string|null|undefined)=>(value||"").trim().split(/\s+/)[0]||"Not assigned";
const formatDateTime=(value:string|null)=>value?new Intl.DateTimeFormat("en-NP",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}).format(new Date(value)):"";

export default function ClassDetailsPage(){
  const params=useParams<{id:string}>();
  const router=useRouter();
  const classId=Array.isArray(params.id)?params.id[0]:params.id;
  const [tab,setTab]=useState<Tab>("overview");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [baseRow,setBaseRow]=useState<ClassRow|null>(null);
  const [rows,setRows]=useState<ClassRow[]>([]);
  const [students,setStudents]=useState<Student[]>([]);
  const [teachers,setTeachers]=useState<Teacher[]>([]);
  const [assignments,setAssignments]=useState<TeacherAssignment[]>([]);
  const [attendance,setAttendance]=useState<Attendance[]>([]);

  useEffect(()=>{let active=true;async function load(){
    const cached=classDetailsCache.get(classId);
    if(cached){
      setBaseRow(cached.baseRow);setRows(cached.rows);setStudents(cached.students);setTeachers(cached.teachers);setAssignments(cached.assignments);setAttendance(cached.attendance);setLoading(false);
    }else setLoading(true);
    setError("");
    try{
      const {data:{user},error:authError}=await supabase.auth.getUser();
      if(authError)throw authError;
      if(!user)throw new Error("Please sign in again.");
      const [profileResult,selectedResult]=await Promise.all([
        supabase.from("profiles").select("school_id,role").eq("user_id",user.id).single(),
        supabase.from("classes").select("id,school_id,class_name,class,name,class_number,section,section_name,teacher_id,academic_year,archived_at").eq("id",classId).is("archived_at",null).single(),
      ]);
      const {data:profile,error:profileError}=profileResult;
      const {data:selected,error:selectedError}=selectedResult;
      if(profileError||!profile?.school_id)throw profileError||new Error("School profile could not be loaded.");
      if(selectedError||!selected)throw selectedError||new Error("Class could not be found.");
      const school=profile.school_id as string;
      if(selected.school_id!==school)throw new Error("Class could not be found.");
      const selectedRow=selected as ClassRow;
      const since=new Date();since.setUTCDate(since.getUTCDate()-30);
      const plainClass=rawClass(selectedRow).trim().replace(/^(class|grade)\s+/i,"");
      const classVariants=[...new Set([rawClass(selectedRow),plainClass,`Class ${plainClass}`,`Grade ${plainClass}`,plainClass.toLowerCase(),plainClass.toUpperCase()])];
      const [classResult,studentResult,teacherResult,assignmentResult,attendanceResult]=await Promise.all([
        supabase.from("classes").select("id,school_id,class_name,class,name,class_number,section,section_name,teacher_id,academic_year,archived_at").eq("school_id",school).eq("academic_year",selectedRow.academic_year).is("archived_at",null),
        supabase.from("students").select("id,name,class,section,created_at").eq("school_id",school).in("class",classVariants),
        supabase.from("teachers").select("id,name,subject,avatar_path").eq("school_id",school).is("left_at",null),
        supabase.from("teacher_assignments").select("id,teacher_id,class_id,class_name,subject,active,created_at").eq("school_id",school),
        supabase.from("attendance").select("status,attendance_date,class_name,section").eq("school_id",school).in("class_name",classVariants).gte("attendance_date",since.toISOString().slice(0,10)),
      ]);
      const failure=[classResult,studentResult,teacherResult,assignmentResult,attendanceResult].find(result=>result.error)?.error;
      if(failure)throw failure;
      const key=norm(rawClass(selectedRow));
      const classRows=((classResult.data||[]) as ClassRow[]).filter(row=>norm(rawClass(row))===key);
      const classStudents=((studentResult.data||[]) as Student[]).filter(student=>norm(student.class)===key);
      const rowIds=new Set(classRows.map(row=>row.id));
      const classAssignments=((assignmentResult.data||[]) as TeacherAssignment[]).filter(item=>item.active!==false&&(Boolean(item.class_id&&rowIds.has(item.class_id))||norm(item.class_name)===key));
      const classAttendance=((attendanceResult.data||[]) as Attendance[]).filter(item=>norm(item.class_name)===key);
      if(!active)return;
      const details={baseRow:selectedRow,rows:classRows,students:classStudents,teachers:(teacherResult.data||[]) as Teacher[],assignments:classAssignments,attendance:classAttendance};
      classDetailsCache.set(classId,details);
      setBaseRow(details.baseRow);setRows(details.rows);setStudents(details.students);setTeachers(details.teachers);setAssignments(details.assignments);setAttendance(details.attendance);
    }catch(cause){if(active)setError(cause instanceof Error?cause.message:"Class details could not be loaded.");}
    finally{if(active)setLoading(false);}
  }load();return()=>{active=false;};},[classId]);

  const teacherMap=useMemo(()=>new Map(teachers.map(teacher=>[teacher.id,teacher])),[teachers]);
  const sectionRows=useMemo(()=>rows.filter(row=>sectionName(row)),[rows]);
  const sections=useMemo(()=>sectionRows.map(row=>({
    id:row.id,name:sectionName(row),teacher:row.teacher_id?teacherMap.get(row.teacher_id)?.name||"Teacher unavailable":"Not assigned",
    students:students.filter(student=>(student.section||"").trim().toLowerCase()===sectionName(row).toLowerCase()).length,
  })).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})),[sectionRows,students,teacherMap]);
  const assignedTeachers=useMemo(()=>{
    const seen=new Set<string>();
    return assignments.flatMap(item=>{const teacher=teacherMap.get(item.teacher_id);const key=`${item.teacher_id}:${item.subject||teacher?.subject||""}`;if(!teacher||seen.has(key))return[];seen.add(key);return[{...teacher,subject:item.subject||teacher.subject||"Subject not set",assignmentId:item.id,created_at:item.created_at}];});
  },[assignments,teacherMap]);
  const classTeachers=useMemo(()=>{
    const ids=(sectionRows.length?sectionRows:rows.filter(row=>!sectionName(row))).map(row=>row.teacher_id).filter((id):id is string=>Boolean(id));
    return [...new Set(ids)].map(id=>teacherMap.get(id)?.name).filter((name):name is string=>Boolean(name));
  },[sectionRows,rows,teacherMap]);
  const classTeacherLabel=classTeachers.length===0?"Not assigned":classTeachers.length===1?classTeachers[0]:"Multiple teachers";
  const present=attendance.filter(item=>["present","late"].includes((item.status||"").toLowerCase())).length;
  const marked=attendance.filter(item=>!["holiday","no record"].includes((item.status||"").toLowerCase())).length;
  const attendanceRate=marked?Math.round(present/marked*100):null;
  const title=displayClass(baseRow?rawClass(baseRow):"Class");
  const classQuery=encodeURIComponent(baseRow?rawClass(baseRow):title);
  const today=nepalDay();
  const newestStudent=students.slice().sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||""))[0];
  const latestAttendance=attendance.slice().sort((a,b)=>b.attendance_date.localeCompare(a.attendance_date))[0];
  const latestAssignment=assignments.slice().sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||""))[0];

  if(loading)return <PageShell><div className="mx-auto max-w-6xl animate-pulse space-y-3"><div className="h-24 rounded-xl bg-blue-50"/><div className="grid grid-cols-2 gap-2"><div className="h-20 rounded-xl bg-white"/><div className="h-20 rounded-xl bg-white"/><div className="h-20 rounded-xl bg-white"/><div className="h-20 rounded-xl bg-white"/></div><div className="h-64 rounded-xl bg-white"/></div></PageShell>;

  return <PageShell><div className="mx-auto max-w-6xl">
    {error&&<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {!error&&baseRow&&<>
      <header className="-mx-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 px-3 py-3 sm:mx-0 sm:rounded-xl sm:border sm:px-5 sm:py-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={()=>window.history.length>1?router.back():router.push("/principal/classes")} aria-label="Back to classes" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 text-slate-600 shadow-sm"><ArrowLeft className="h-5 w-5"/></button>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl" role="img" aria-label="Class books">📚</span>
          <div className="min-w-0 flex-1"><h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-950">{title}</h1><p className="truncate text-[11px] text-slate-600 sm:text-sm">Manage sections, students, teachers and class activities.</p></div>
          <div className="flex h-14 min-w-[74px] shrink-0 flex-col items-center justify-center rounded-xl bg-blue-600 px-2 text-white shadow-sm"><span className="text-[9px] font-semibold uppercase text-blue-100">Students</span><strong className="text-2xl font-black leading-6">{students.length}</strong></div>
        </div>
      </header>

      <section className="mt-3 grid grid-cols-2 gap-2">
        <Metric icon={Layers3} label="Sections" value={String(sections.length)}/>
        <Metric icon={Users} label="Students" value={String(students.length)}/>
        <Metric icon={GraduationCap} label="Class Teacher" value={classTeacherLabel} compact/>
        <Metric icon={CalendarCheck} label="Attendance Rate" value={attendanceRate===null?"—":`${attendanceRate}%`}/>
      </section>

      <nav className="mt-3 grid grid-cols-4 border-b border-slate-200" aria-label="Class details tabs">
        {(["overview","students","teachers","sections"] as Tab[]).map(item=><button key={item} onClick={()=>setTab(item)} className={`relative px-1 py-2.5 text-xs font-bold capitalize ${tab===item?"text-blue-700":"text-slate-500"}`}>{item}{tab===item&&<span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-blue-600"/>}</button>)}
      </nav>

      {tab==="overview"&&<div className="mt-3 space-y-3">
        <Card title="Sections" icon={Users} action={<Link href={`/principal/classes?class=${classId}`} className="text-xs font-bold text-blue-600">Manage <ChevronRight className="inline h-4 w-4"/></Link>}>
          {sections.length?<div className="space-y-2">{sections.map(section=><button key={section.id} onClick={()=>setTab("sections")} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 font-extrabold text-blue-700">{section.name}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">Section {section.name}</strong><span className="block truncate text-[11px] text-slate-500">Teacher: {section.teacher}</span></span><span className="flex items-center gap-1 text-xs text-slate-600"><Users className="h-4 w-4"/>{section.students} students</span><ChevronRight className="h-4 w-4 text-slate-400"/></button>)}</div>:<Empty text="No sections have been added yet."/>}
        </Card>

        <Card title="Assigned Teachers" icon={GraduationCap} action={<button onClick={()=>setTab("teachers")} className="text-xs font-bold text-blue-600">View all <ChevronRight className="inline h-4 w-4"/></button>}>
          {assignedTeachers.length?<div className="divide-y divide-slate-100">{assignedTeachers.slice(0,4).map(teacher=><div key={teacher.assignmentId} className="flex items-center gap-2 py-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700">{teacher.name.split(/\s+/).slice(0,2).map(part=>part[0]).join("")}</span><strong className="min-w-0 flex-1 truncate text-sm">{firstName(teacher.name)}</strong><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{teacher.subject}</span><span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">✓</span></div>)}</div>:<Empty text="No subject teachers are assigned."/>}
        </Card>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Card title="Quick Actions" icon={Zap}>
            <div className="grid grid-cols-2 gap-2">
              <Action href={`/principal/students?class=${classQuery}`} icon={Users} label="View Students"/>
              <Action href={`/principal/classes?class=${classId}`} icon={Layers3} label="Manage Sections"/>
              <Action href={`/principal/teachers?tab=assignments&class=${classId}`} icon={UserRoundPlus} label="Assign Teacher"/>
              <Action href={`/principal/attendance?class=${classQuery}`} icon={CalendarCheck} label="View Attendance"/>
            </div>
          </Card>
          <Card title="Recent Activity" icon={Clock3}>
            <div className="divide-y divide-slate-100">
              {newestStudent&&<Activity icon={UserRoundPlus} title={`${newestStudent.name} added to ${title}`} time={formatDateTime(newestStudent.created_at)}/>}
              {latestAttendance&&<Activity icon={CalendarCheck} title={latestAttendance.attendance_date===today?"Attendance updated for today":"Attendance was updated"} time={latestAttendance.attendance_date}/>}
              {latestAssignment&&<Activity icon={GraduationCap} title="Teacher assignment updated" time={formatDateTime(latestAssignment.created_at)}/>}
              {!newestStudent&&!latestAttendance&&!latestAssignment&&<Empty text="No recent class activity."/>}
            </div>
          </Card>
        </div>
      </div>}

      {tab==="students"&&<CardWrap>{students.length?<div className="divide-y divide-slate-100">{students.sort((a,b)=>a.name.localeCompare(b.name)).map(student=><Link key={student.id} href={`/principal/students?student=${student.id}`} className="flex items-center gap-3 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{student.name.split(/\s+/).slice(0,2).map(part=>part[0]).join("")}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{student.name}</strong><span className="text-xs text-slate-500">Section {student.section||"Unassigned"}</span></span><ChevronRight className="h-4 w-4 text-slate-400"/></Link>)}</div>:<Empty text="No students are assigned to this class."/>}</CardWrap>}

      {tab==="teachers"&&<CardWrap>{assignedTeachers.length?<div className="divide-y divide-slate-100">{assignedTeachers.map(teacher=><div key={teacher.assignmentId} className="flex items-center gap-3 py-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-700">{teacher.name.split(/\s+/).slice(0,2).map(part=>part[0]).join("")}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{teacher.name}</strong><span className="text-xs text-slate-500">{teacher.subject}</span></span></div>)}</div>:<Empty text="No teachers are assigned to this class."/>}</CardWrap>}

      {tab==="sections"&&<CardWrap>{sections.length?<div className="space-y-2">{sections.map(section=><div key={section.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 font-extrabold text-blue-700">{section.name}</span><span className="min-w-0 flex-1"><strong className="block text-sm">Section {section.name}</strong><span className="block truncate text-xs text-slate-500">Teacher: {section.teacher}</span></span><span className="text-xs font-semibold text-slate-600">{section.students} students</span></div></div>)}</div>:<Empty text="No sections have been added yet."/>}<Link href={`/principal/classes?class=${classId}`} className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4"/>Manage sections</Link></CardWrap>}
    </>}
  </div></PageShell>;
}

function PageShell({children}:{children:React.ReactNode}){return <div className="min-h-screen bg-slate-50 text-slate-950"><Sidebar/><div className="flex min-h-screen flex-col pt-[55px] lg:ml-64 lg:pt-10"><div className="hidden lg:block"><TopBar/></div><main className="flex-1 px-3 pb-28 pt-0 sm:px-6 lg:px-8 lg:pt-24">{children}</main></div></div>;}
function Metric({icon:Icon,label,value,compact=false}:{icon:React.ElementType;label:string;value:string;compact?:boolean}){return <div className="flex min-h-[72px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5"/></span><span className="min-w-0"><span className="block text-xs font-medium text-slate-600">{label}</span><strong className={`block truncate font-extrabold text-slate-950 ${compact?"text-sm":"text-xl"}`}>{value}</strong></span></div>;}
function Card({title,icon:Icon,action,children}:{title:string;icon:React.ElementType;action?:React.ReactNode;children:React.ReactNode}){return <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><div className="mb-2 flex items-center gap-2"><Icon className="h-5 w-5 text-blue-600"/><h2 className="flex-1 text-base font-extrabold">{title}</h2>{action}</div>{children}</section>;}
function CardWrap({children}:{children:React.ReactNode}){return <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">{children}</section>;}
function Empty({text}:{text:string}){return <p className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">{text}</p>;}
function Action({href,icon:Icon,label}:{href:string;icon:React.ElementType;label:string}){return <Link href={href} className="flex min-h-[82px] flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white p-2 text-center text-xs font-bold text-slate-800"><Icon className="h-5 w-5 text-blue-600"/>{label}</Link>;}
function Activity({icon:Icon,title,time}:{icon:React.ElementType;title:string;time:string}){return <div className="flex gap-2 py-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon className="h-4 w-4"/></span><span className="min-w-0"><strong className="block text-xs leading-4">{title}</strong><span className="text-[11px] text-slate-500">{time}</span></span></div>;}
