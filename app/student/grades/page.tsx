'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, Download, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

type Exam = { id:string; name:string; start_date:string|null; academic_year:number|null; published_at:string|null };
type Subject = { id:string; exam_id:string; subject_name:string; full_marks:number; pass_marks:number };
type Mark = { subject_id:string; marks:number };
type Student = { id:string; name:string; class:string|null; section:string|null; roll_no:string|null; school_id:string };
type GradeRange = {grade:string;min:number;max:number;gpa?:number};
const percentage=(obtained:number,full:number)=>full?Math.round(obtained/full*1000)/10:0;

export default function StudentGradesPage(){
  const [student,setStudent]=useState<Student|null>(null);
  const [school,setSchool]=useState('');
  const [gradeScale,setGradeScale]=useState<GradeRange[]>([]);
  const [gradingSystem,setGradingSystem]=useState('percentage');
  const [exams,setExams]=useState<Exam[]>([]);
  const [subjects,setSubjects]=useState<Subject[]>([]);
  const [marks,setMarks]=useState<Mark[]>([]);
  const [selected,setSelected]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;async function load(){try{
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)throw new Error('Please sign in to view your results.');
    const {data:record,error:studentError}=await supabase.from('students').select('id,name,class,section,roll_no,school_id').eq('user_id',user.id).single();
    if(studentError||!record)throw new Error('Your student record could not be loaded.');
    const [schoolResult,examsResult,subjectsResult,marksResult]=await Promise.all([
      supabase.from('schools').select('name,grade_scale,grading_system').eq('id',record.school_id).single(),
      supabase.from('exams').select('id,name,start_date,academic_year,published_at').eq('school_id',record.school_id).not('published_at','is',null).order('start_date',{ascending:false}),
      supabase.from('exam_subjects').select('id,exam_id,subject_name,full_marks,pass_marks').eq('school_id',record.school_id).eq('class_name',record.class||'').eq('section',record.section||''),
      supabase.from('exam_marks').select('subject_id,marks').eq('school_id',record.school_id).eq('student_id',record.id),
    ]);
    const failure=[examsResult,subjectsResult,marksResult].find(result=>result.error)?.error;
    if(failure)throw failure;
    if(active){setStudent(record as Student);setSchool(schoolResult.data?.name||'');setGradeScale(Array.isArray(schoolResult.data?.grade_scale)?schoolResult.data.grade_scale as unknown as GradeRange[]:[]);setGradingSystem(schoolResult.data?.grading_system||'percentage');setExams((examsResult.data||[]) as Exam[]);setSubjects((subjectsResult.data||[]) as Subject[]);setMarks((marksResult.data||[]) as Mark[]);}
  }catch(cause){if(active)setError(cause instanceof Error?cause.message:'Results could not be loaded.');}finally{if(active)setLoading(false);}}load();return()=>{active=false;};},[]);
  const exam=exams.find(item=>item.id===selected)||null;
  const rows=exam?subjects.filter(item=>item.exam_id===exam.id).map(subject=>({subject,mark:marks.find(item=>item.subject_id===subject.id)})):[];
  const complete=rows.length>0&&rows.every(row=>Boolean(row.mark));
  const obtained=rows.reduce((sum,row)=>sum+Number(row.mark?.marks||0),0);
  const full=rows.reduce((sum,row)=>sum+Number(row.subject.full_marks),0);
  const passed=complete&&rows.every(row=>Number(row.mark?.marks)>=Number(row.subject.pass_marks));
  const resultPercentage=complete?percentage(obtained,full):null;
  const grade=resultPercentage===null?null:gradeScale.find(range=>resultPercentage>=Number(range.min)&&resultPercentage<=Number(range.max));
  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"><style jsx global>{`@media print { body * { visibility: hidden !important; } .print-card, .print-card * { visibility: visible !important; } .print-card { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; color: black; } .print-card button { display: none !important; } }`}</style><Sidebar/><div className="flex min-h-screen flex-col pt-10 lg:ml-64"><TopBar/><main className="flex-1 px-3 pb-24 pt-7 sm:px-6 lg:px-8 lg:pt-24"><div className="mx-auto max-w-4xl"><header className="rounded-xl bg-blue-50 p-4 dark:bg-slate-900"><h1 className="text-xl font-bold">Grades & Results</h1><p className="text-xs text-slate-500 dark:text-slate-300">Your published exam results and report cards.</p></header>{loading?<p className="mt-4 text-sm text-slate-500">Loading results…</p>:error?<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>:!exam?<section className="mt-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-bold">Published results</h2>{exams.filter(item=>subjects.some(subject=>subject.exam_id===item.id)).length?exams.filter(item=>subjects.some(subject=>subject.exam_id===item.id)).map(item=><button key={item.id} onClick={()=>setSelected(item.id)} className="flex w-full items-center justify-between border-t border-slate-100 py-3 text-left text-sm dark:border-slate-800"><span>{item.name}<small className="block text-slate-500">{item.academic_year||'Academic year not set'}</small></span><ChevronRight className="h-4 w-4"/></button>):<p className="py-7 text-center text-sm text-slate-500">No results have been published for your class yet.</p>}</section>:<div className="print-card"><button onClick={()=>setSelected(null)} className="my-3 text-sm text-blue-600 print:hidden">← All results</button><section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-slate-500">{school} · {exam.name}</p><h2 className="mt-1 text-lg font-bold">{student?.name}</h2><p className="text-xs text-slate-500">Class {student?.class}{student?.section?` (${student.section})`:''} · Roll {student?.roll_no||'—'}</p><div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-sm dark:border-slate-800"><div><p className="text-xs text-slate-500">Marks</p><strong>{complete?`${obtained}/${full}`:'—'}</strong></div><div><p className="text-xs text-slate-500">Percentage</p><strong>{resultPercentage===null?'—':`${resultPercentage}%`}</strong></div><div><p className="text-xs text-slate-500">Result</p><strong>{complete?(passed?'Passed':'Failed'):'Incomplete'}</strong></div>{gradingSystem!=='percentage'&&<div><p className="text-xs text-slate-500">Grade / GPA</p><strong>{grade?`${grade.grade}${grade.gpa!==undefined?` (${grade.gpa})`:''}`:'—'}</strong></div>}</div></section><section className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><h3 className="p-3 text-sm font-bold">Subject-wise Marks</h3><div className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map(({subject,mark})=><div key={subject.id} className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 text-xs"><span>{subject.subject_name}</span><span>{mark?mark.marks:'—'} / {subject.full_marks}</span><span>{mark?mark.marks>=subject.pass_marks?'Pass':'Fail':'Pending'}</span></div>)}</div></section><p className="mt-3 text-xs text-slate-500">{grade?'Grade calculated from the school grading scale.':'No matching grade range is configured.'}</p><div className="mt-3 flex gap-2 print:hidden"><button onClick={()=>window.print()} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700"><Printer className="h-4 w-4"/>Print</button><button onClick={()=>window.print()} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700"><Download className="h-4 w-4"/>Save PDF</button></div></div>}</div></main></div></div>;
}
