import assert from 'node:assert/strict';
import { readFile,writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { SCHOOL,PROJECT,MARKER } from './plan.mjs';

const root=new URL('../../',import.meta.url);
const credentials=JSON.parse(await readFile(new URL('.demo-runtime/credentials.json',root),'utf8')).credentials;
const plan=JSON.parse(await readFile(new URL('.demo-runtime/plan.json',root),'utf8'));
const env=Object.fromEntries((await readFile(new URL('.env.local',root),'utf8')).trim().split('\n').map(s=>s.split(/=(.*)/s).slice(0,2)));
const key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const client=()=>createClient(`https://${PROJECT}.supabase.co`,key,{auth:{persistSession:false,autoRefreshToken:false}});
const report={school:SCHOOL,accounts:[],counts:{},checks:[]};
let principal,student;
for(const a of credentials) {
  assert(a.password,`Missing private credentials for ${a.email}`);
  const c=client();const {data,error}=await c.auth.signInWithPassword({email:a.email,password:a.password});assert.ifError(error);
  assert.equal(data.user.id,a.id);assert.equal(data.user.app_metadata.demo_seed,MARKER);assert.equal(data.user.app_metadata.school_id,SCHOOL);
  const profile=await c.from('profiles').select('school_id,role').eq('user_id',a.id).maybeSingle();assert.ifError(profile.error);
  if(a.status==='approved'){assert.equal(profile.data?.school_id,SCHOOL);assert.equal(profile.data?.role,a.role);}
  else assert.equal(profile.data,null);
  report.accounts.push({email:a.email,role:a.role,status:a.status,login:true});
  if(a.role==='admin')principal=c;
  else if(a.role==='student'&&!student)student=c;
  else await c.auth.signOut();
}
for(const [table,rows] of Object.entries(plan.rows)) {
  if(['account_requests','profiles'].includes(table))continue;
  const {count,error}=await principal.from(table).select('id',{count:'exact',head:true}).eq(table==='schools'?'id':'school_id',SCHOOL);assert.ifError(error);assert.equal(count,rows.length,`${table} count`);report.counts[table]=count;
}
async function all(table) {
  const rows=[];for(let offset=0;;offset+=1000){const {data,error}=await principal.from(table).select('*').eq('school_id',SCHOOL).order('id').range(offset,offset+999);assert.ifError(error);rows.push(...data);if(data.length<1000)return rows;}
}
const [students,teachers,classes,attendance,staff,payments,exams,subjects,marks,events,leaves,assignments,documents]=await Promise.all(['students','teachers','classes','attendance','teacher_attendance','fee_records','exams','exam_subjects','exam_marks','news_events','teacher_leave_requests','teacher_assignments','documents'].map(all));
const studentById=new Map(students.map(s=>[s.id,s])),teacherById=new Map(teachers.map(t=>[t.id,t])),subjectById=new Map(subjects.map(s=>[s.id,s]));
for(const s of students)assert(classes.some(c=>c.class_number===s.class&&(c.section||'')===(s.section||'')));
for(const a of attendance){assert.equal(studentById.get(a.student_id)?.school_id,SCHOOL);assert.equal(a.class_name,studentById.get(a.student_id).class);assert.equal(a.section,studentById.get(a.student_id).section);}
for(const a of staff)assert.equal(teacherById.get(a.teacher_id)?.school_id,SCHOOL);
for(const payment of payments){assert(studentById.has(payment.student_id));assert(payment.payment_date<=plan.anchor);assert(payment.amount>0);}
for(const mark of marks){const s=subjectById.get(mark.subject_id),p=studentById.get(mark.student_id);assert(s&&p);assert.equal(s.class_name,p.class);assert.equal(s.section,p.section||'');assert(mark.marks>=0&&mark.marks<=s.full_marks);}
const published=exams.filter(e=>e.published_at);assert.equal(published.length,2);
for(const exam of published)for(const subject of subjects.filter(s=>s.exam_id===exam.id))for(const s of students.filter(s=>s.class===subject.class_name&&(s.section||'')===subject.section))assert(marks.some(m=>m.subject_id===subject.id&&m.student_id===s.id),'Complete published result');
assert(events.some(e=>e.event_date===plan.anchor));assert(events.some(e=>e.event_date>plan.anchor));assert(leaves.some(l=>l.status==='pending'));assert(assignments.some(a=>a.teacher_id===null));
const current=payments.filter(p=>p.payment_date.startsWith(plan.anchor.slice(0,7)));
const balances=students.map(s=>current.filter(p=>p.student_id===s.id).reduce((sum,p)=>sum+Number(p.amount),0));
assert(balances.includes(0)&&balances.includes(1500)&&balances.includes(3000));
for(const days of [7,14,30]){const start=new Date(Date.parse(plan.anchor+'T00:00Z')-(days-1)*86400000).toISOString().slice(0,10);assert(new Set(attendance.filter(a=>a.attendance_date>=start).map(a=>a.attendance_date)).size>=days-5);}
for(const document of documents){const {data,error}=await principal.storage.from('school-documents').download(document.storage_path);assert.ifError(error);assert.equal(data.size,document.file_size);assert((await data.text()).startsWith('%PDF-'));}
const anon=client();for(const table of ['schools','students','teachers','classes','attendance','fee_records','fee_types','exams','exam_subjects','exam_marks','news_events','notices','documents','direct_conversations','direct_messages','activity_logs','public_school_teachers']){const {data,error}=await anon.from(table).select('*').eq(table==='schools'?'id':'school_id',SCHOOL);if(!error)assert.equal(data.length,0,`Anonymous leak: ${table}`);else assert(['42501','PGRST301'].includes(error.code),`${table}: ${error.message}`);}
const teacherRpc=await anon.rpc('get_school_teachers',{school_uuid:SCHOOL});assert.ifError(teacherRpc.error);assert.equal(teacherRpc.data.length,0);
const statsRpc=await anon.rpc('get_school_stats',{school_uuid:SCHOOL});assert.ifError(statsRpc.error);assert.equal(statsRpc.data[0].students,0);assert.equal(statsRpc.data[0].teachers,0);
const own=await student.from('exam_marks').select('student_id');assert.ifError(own.error);const ownId=students.find(s=>s.user_id===credentials.find(a=>a.role==='student').id).id;assert(own.data.length>0&&own.data.every(m=>m.student_id===ownId));
report.checks=['28 Auth logins and approval gates','All module record counts','Student/class and attendance relationships','Teacher attendance relationships','Fee history and paid/partial/unpaid states','Published result completeness and marks bounds','7/14/30 day histories','Upcoming and pending items','All PDFs download and sizes','Anonymous table and legacy RPC isolation','Student sees only own published marks'];
await principal.auth.signOut();await student.auth.signOut();
await writeFile(new URL('.demo-runtime/verification.json',root),JSON.stringify(report,null,2));
console.log(JSON.stringify({accounts:report.accounts.length,counts:report.counts,checks:report.checks},null,2));
