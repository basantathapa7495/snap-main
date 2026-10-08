import { createHash } from 'node:crypto';
import NepaliDateModule from 'nepali-date-converter';
const NepaliDate = NepaliDateModule.default || NepaliDateModule;

export const PROJECT = 'opwsxpgrhyrjttomxetc';
export const MARKER = 'nepsom-sunrise-demo-v1';
export const SLUG = 'demo-sunrise-valley';
export const SCHOOL_NAME = 'Sunrise Valley Second Secondary School [DEMO]';
export function id(key) {
  const h = createHash('sha256').update(`${MARKER}:${key}`).digest('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
}
export const SCHOOL = id('school');
export const PRINCIPAL = id('auth:principal');
const pad = n => String(n).padStart(3,'0');
const subjects = ['Nepali','English','Mathematics','Science','Social Studies','Computer Science'];
export const accounts = [
  { id: PRINCIPAL, email: 'principal@sunrise-demo.example.com', role: 'admin', name: 'Demo Principal 001', status: 'approved' },
  ...Array.from({length:20},(_,i)=>({id:id(`auth:teacher:${i}`),email:`teacher${pad(i+1)}@sunrise-demo.example.com`,role:'teacher',name:`Demo Teacher ${pad(i+1)}`,status:'approved'})),
  ...[0,14,60,120,179].map(i=>({id:id(`auth:student:${i}`),email:`student${pad(i+1)}@sunrise-demo.example.com`,role:'student',name:`Demo Student ${pad(i+1)}`,status:'approved'})),
  ...['pending','rejected'].map((status,i)=>({id:id(`auth:join:${i}`),email:`join-${status}@sunrise-demo.example.com`,role:'teacher',name:`Demo Joining Applicant ${pad(i+1)}`,status})),
];
export function createPlan(anchor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor) || new Date(`${anchor}T12:00Z`).toISOString().slice(0,10)!==anchor) throw new Error('Invalid anchor date');
  const year = Number(new NepaliDate(new Date(`${anchor}T12:00:00Z`)).format('YYYY'));
  const day = offset => new Date(Date.parse(`${anchor}T00:00Z`)+offset*86400000).toISOString().slice(0,10);
  const time = (offset,hour='09:30') => `${day(offset)}T${hour}:00+05:45`;
  const rows = {};
  const add = (table,key,data) => { const row={id:id(`${table}:${key}`),school_id:SCHOOL,...data}; (rows[table]??=[]).push(row); return row; };
  const school = {id:SCHOOL,name:SCHOOL_NAME,slug:SLUG,principal:'Demo Principal 001',email:'office@sunrise-demo.example.com',school_email:'office@sunrise-demo.example.com',phone:'DEMO-000-0000',address:'Demo Campus, fictional address, Nepal',province:'Bagmati',district:'Kathmandu',municipality:'Demo Municipality',ward:1,school_type:'Private',school_level:'Secondary',highest_grade:12,is_approved:true,public_website_enabled:false,show_teachers:false,online_admissions_enabled:true,teacher_portal_enabled:true,student_portal_enabled:true,grading_system:'both',default_pass_mark:40,created_at:time(-190),short_description:`${MARKER}: fictional isolated school for testing only.`,about_text:'This school and every person in it are fictional demo records.'};
  rows.schools=[school];
  for (const a of accounts.filter(a=>a.status==='approved')) add('profiles',a.id,{user_id:a.id,role:a.role,full_name:a.name,phone:'DEMO-000-0000',created_at:time(-190)});
  const teachers=Array.from({length:20},(_,i)=>add('teachers',i,{name:`Demo Teacher ${pad(i+1)}`,subject:i<18?subjects[Math.floor(i/3)]:'Learning Support',department:i<18?subjects[Math.floor(i/3)]:'Student Support',email:`teacher${pad(i+1)}@sunrise-demo.example.com`,phone:`DEMO-T-${pad(i+1)}`,qualification:i<12?'B.Ed. (Demo)':'M.Ed. (Demo)',address:'Fictional demo address',salary:28000+i*1000,user_id:id(`auth:teacher:${i}`),joining_date:day(-190-i*10),date_of_birth:`${1980+i}-06-15`,employment_status:i===19?'inactive':i===2?'on_leave':'active',employee_id:`DEMO-T-${pad(i+1)}`,left_at:i===19?day(-20):null,created_at:time(-190)}));
  const groups=[];
  for(let grade=1;grade<=12;grade++) {
    const base=add('classes',`${grade}:base`,{academic_year:year,class_name:`Class ${grade}`,class:String(grade),name:`Class ${grade}`,class_number:String(grade),section:null,section_name:null,teacher_id:teachers[(grade-1)%18].id,created_at:time(-190)});
    if(grade<=8) groups.push({grade,section:'',row:base});
    else for(const section of ['A','B']) groups.push({grade,section,row:add('classes',`${grade}:${section}`,{academic_year:year,class_name:`Class ${grade}`,class:String(grade),name:`Class ${grade}`,class_number:String(grade),section,section_name:section,teacher_id:teachers[groups.length%18].id,created_at:time(-190)})});
  }
  const students=Array.from({length:180},(_,i)=>{
    const grade=Math.floor(i/15)+1,local=i%15,section=grade<=8?'':local<8?'A':'B';
    const auth=accounts.find(a=>a.id===id(`auth:student:${i}`));
    return add('students',i,{name:`Demo Student ${pad(i+1)}`,class:String(grade),section,roll_no:String(section==='B'?local-7:local+1),gender:i%2?'Female':'Male',date_of_birth:`${Number(anchor.slice(0,4))-grade-5}-0${1+i%9}-15`,dob:`${Number(anchor.slice(0,4))-grade-5}-0${1+i%9}-15`,parent_name:`Demo Guardian ${pad(i+1)}`,parent_phone:i<4?null:`DEMO-G-${pad(i+1)}`,address:'Fictional demo address',email:auth?.email||`student${pad(i+1)}@sunrise-demo.example.com`,user_id:auth?.id||null,created_at:time(-190)});
  });
  const periods=Array.from({length:6},(_,p)=>add('school_periods',p,{academic_year:year,name:`Period ${p+1}`,position:p+1,kind:'lesson',start_time:`${String(10+Math.floor(p/2)).padStart(2,'0')}:${p%2?'30':'00'}`,end_time:`${String(10+Math.floor((p+1)/2)).padStart(2,'0')}:${p%2?'00':'30'}`,created_at:time(-190)}));
  groups.forEach((g,gi)=>subjects.forEach((subject,si)=>add('teacher_assignments',`${gi}:${si}`,{teacher_id:gi===15&&si===5?null:teachers[si*3+gi%3].id,class_id:g.row.id,class_name:`Class ${g.grade}`,subject,period_id:periods[(Math.floor(gi/3)+si)%6].id,weekday:null,academic_year:String(year),periods_per_week:6,active:true,created_at:time(-185)})));
  const leaves=[{teacher:2,start:-1,end:1,status:'approved',type:'sick'},{teacher:5,start:-15,end:-13,status:'approved',type:'casual'},{teacher:7,start:3,end:4,status:'pending',type:'casual'},{teacher:9,start:5,end:7,status:'pending',type:'personal'},{teacher:10,start:-10,end:-9,status:'rejected',type:'casual'},{teacher:12,start:8,end:9,status:'clarification',type:'personal'}];
  leaves.forEach((l,i)=>add('teacher_leave_requests',i,{teacher_id:teachers[l.teacher].id,leave_type:l.type,start_date:day(l.start),end_date:day(l.end),status:l.status,reason:`Demo leave scenario ${i+1}; fictional request.`,reviewed_by:['approved','rejected'].includes(l.status)?PRINCIPAL:null,reviewed_at:['approved','rejected'].includes(l.status)?time(Math.min(l.start-1,-1)):null,principal_note:l.status==='rejected'?'Demo request declined due to examination duty.':null,created_at:time(Math.min(l.start-3,-2))}));
  for(let d=-44;d<=0;d++) {
    if(new Date(`${day(d)}T12:00Z`).getUTCDay()===6) continue;
    students.forEach((s,i)=>{
      if(s.created_at.slice(0,10)>day(d))return;
      const score=(i*13+(d+44)*7)%100;
      const absent=i<7?(d+44)%3!==0:score<5+(d+44)%6;
      add('attendance',`${i}:${d}`,{student_id:s.id,student_name:s.name,class_name:s.class,section:s.section,attendance_date:day(d),status:absent?'absent':score<16?'late':'present',created_at:time(d,'10:15')});
    });
    teachers.forEach((t,i)=>{
      if(t.left_at&&t.left_at<=day(d))return;
      const leave=leaves.some(l=>l.teacher===i&&l.status==='approved'&&d>=l.start&&d<=l.end);
      const status=leave?'leave':(i*7+d+44)%23<2?'absent':'present';
      add('teacher_attendance',`${i}:${d}`,{teacher_id:t.id,attendance_date:day(d),status,check_in:status==='present'?'09:45':null,check_out:status==='present'&&d<0?'15:30':null,notes:leave?'Approved demo leave':`Demo attendance ${MARKER}`,created_at:time(d,'10:00'),updated_at:time(d,'10:00')});
    });
  }
  const fee=add('fee_types','monthly',{name:'Monthly Tuition',amount:2500,due_day:10,description:'Demo monthly tuition in NPR',created_at:time(-190)});
  add('fee_types','activity',{name:'Monthly Activity Fee',amount:500,due_day:15,description:'Demo monthly activity fee in NPR',created_at:time(-190)});
  for(let month=5;month>=0;month--) {
    const date=new Date(`${anchor.slice(0,7)}-01T12:00Z`);date.setUTCMonth(date.getUTCMonth()-month);const key=date.toISOString().slice(0,7);
    students.forEach((s,i)=>{
      const paymentDay=Math.min(Number(anchor.slice(8)),5+i%20),when=`${key}-${String(paymentDay).padStart(2,'0')}`;
      if(s.created_at.slice(0,10)>when)return;
      const type=(i+month*3)%10;
      if(type>=8)return;
      const paid=type<6?3000:1500;
      add('fee_records',`${i}:${key}`,{student_id:s.id,fee_type_id:paid===3000?null:fee.id,student_name:s.name,fee_name:paid===3000?'Monthly school fees':'Monthly Tuition',amount:paid,payment_date:when,payment_method:i%2?'cash':'bank_transfer',receipt_number:`DEMO-${key.replace('-','')}-${pad(i+1)}`,notes:`${MARKER}; tuition ${paid===3000?2500:1500} + activity ${paid===3000?500:0}`,created_at:`${when}T11:00:00+05:45`});
    });
  }
  const examOffsets=[[-100,-94,'First Term Examination',true],[-24,-18,'Second Term Examination',true],[-7,-3,'Monthly Assessment',false],[12,18,'Upcoming Terminal Examination',false]];
  const publish=[];
  examOffsets.forEach(([start,end,name,published],ei)=>{
    const exam=add('exams',ei,{name:`${name} [DEMO]`,exam_type:ei<2?'Terminal':'Assessment',start_date:day(start),end_date:day(end),academic_year:year,created_at:time(start-25)});
    if(published)publish.push(exam.id);
    groups.forEach((g,gi)=>subjects.forEach((subject,si)=>{
      const sub=add('exam_subjects',`${ei}:${gi}:${si}`,{exam_id:exam.id,class_name:String(g.grade),section:g.section,subject_name:subject,full_marks:100,pass_marks:40});
      if(ei===3)return;
      students.filter(s=>s.class===String(g.grade)&&s.section===g.section&&s.created_at.slice(0,10)<=day(start)).forEach(s=>{
        const i=students.indexOf(s);
        if(ei===2&&(i+si)%5===0)return;
        const ability=i<7?25+i*2:45+(i*11)%44;
        const value=Math.max(15,Math.min(98,ability+((i+si*7+ei*3)%17)-8+ei*3));
        add('exam_marks',`${ei}:${gi}:${si}:${i}`,{subject_id:sub.id,student_id:s.id,marks:value,updated_at:time(end+2)});
      });
    }));
  });
  for(let i=0;i<12;i++) {
    const status=i<5?'pending':i<9?'approved':'rejected';
    const application=add('admission_applications',i,{student_name:status==='approved'?students[176+i-5].name:`Demo Admission Applicant ${pad(i+1)}`,class:status==='approved'?students[176+i-5].class:String(1+i%12),gender:i%2?'Female':'Male',dob:status==='approved'?students[176+i-5].dob:'2015-04-15',parent_name:status==='approved'?students[176+i-5].parent_name:`Demo Applicant Guardian ${pad(i+1)}`,parent_phone:status==='approved'?students[176+i-5].parent_phone:`DEMO-A-${pad(i+1)}`,parent_email:`admission${pad(i+1)}@sunrise-demo.example.com`,address:'Fictional demo address',previous_school:'Fictional Demo Primary School',message:'Test admission only. No real applicant.',status,student_id:status==='approved'?students[176+i-5].id:null,reviewed_by:status==='pending'?null:PRINCIPAL,reviewed_at:status==='pending'?null:time(status==='approved'?-190:-2),created_at:time(status==='approved'?-195:-10-i)});
    if(status==='approved')add('activity_logs',`admission:${i}`,{action_type:`admission_approved:${application.id}`,description:`${application.student_name} approved into Class ${application.class} [DEMO]`,actor_name:'Demo Principal 001',created_at:application.reviewed_at});
  }
  [-14,-3,0,1,3,7,14,28].forEach((d,i)=>add('news_events',i,{title:`${['Demo parent consultation','Demo staff review','Demo science exhibition','Demo staff planning','Demo sports day','Demo fee review meeting','Demo reading festival','Demo cultural program'][i]}`,content:'Fictional school event for testing calendar and upcoming dashboard.',event_date:day(d),event_time:'13:00',end_date:day(d),end_time:'14:00',all_day:false,is_event:true,category:i%2?'meeting':'event',audience:'school',class_targets:[],location:'Demo School Hall',created_by:PRINCIPAL,created_at:time(-5)}));
  for(let i=0;i<8;i++) {
    const status=i<4?'published':i<6?'scheduled':'draft',audience=i%2?'students':'teachers';
    add('notices',i,{title:`Demo ${audience} notice ${i+1}`,content:'Fictional notice: please review the demo school schedule.',priority:i===0?'high':'normal',target_audience:audience,status,publish_date:day(status==='scheduled'?i-3:-i-1),published_at:status==='published'?time(-i-1):null,scheduled_at:status==='scheduled'?time(i-3,'14:00'):null,created_by:PRINCIPAL,created_at:time(-i-2),updated_at:time(-i-1)});
  }
  for(const [i,a] of accounts.filter(a=>a.status==='approved'&&a.role!=='admin').slice(0,3).entries()) {
    const conv=add('direct_conversations',i,{principal_id:PRINCIPAL,recipient_id:a.id,recipient_role:a.role,created_at:time(-3),updated_at:time(-1)});
    add('direct_messages',`${i}:0`,{conversation_id:conv.id,sender_id:PRINCIPAL,content:'Demo message: please confirm your teaching plan.',read_at:time(-2),created_at:time(-3)});
    add('direct_messages',`${i}:1`,{conversation_id:conv.id,sender_id:a.id,content:'Demo reply: my teaching plan is ready for review.',read_at:i===0?null:time(-1),created_at:time(-1)});
    add('scheduled_direct_messages',i,{conversation_id:conv.id,principal_id:PRINCIPAL,content:'Demo reminder: please attend the planning meeting.',status:i===2?'draft':'scheduled',scheduled_at:i===2?null:time(i+1,'08:00'),created_at:time(-1),updated_at:time(-1)});
  }
  accounts.filter(a=>a.status!=='approved').forEach((a,i)=>add('account_requests',i,{auth_user_id:a.id,requested_role:a.role,full_name:a.name,email:a.email,subject:'English',status:a.status,reviewed_by:a.status==='rejected'?PRINCIPAL:null,reviewed_at:a.status==='rejected'?time(-1):null,created_at:time(-3)}));
  const category=add('document_categories','school',{name:'Demo School Resources',created_by:PRINCIPAL,created_at:time(-3),updated_at:time(-3)});
  const files=[];
  ['Demo School Handbook','Demo Teacher Guide','Demo Expiring Circular','Demo Scheduled Circular','Demo Principal Notes'].forEach((title,i)=>{
    const documentId=id(`documents:${i}`),path=`${SCHOOL}/${documentId}/demo-${i}.pdf`;
    const bytes=demoPdf(title);
    files.push({path,base64:Buffer.from(bytes).toString('base64')});
    add('documents',i,{title,category_id:category.id,storage_path:path,original_file_name:`demo-${i}.pdf`,mime_type:'application/pdf',file_size:Buffer.byteLength(bytes),visible_public:false,visible_teachers:i!==4,visible_students:i===0||i===2||i===3,principal_only:i===4,teacher_target_mode:i!==4?'all':null,student_target_mode:i===0||i===2||i===3?'all':null,publish_at:time(i===3?3:-2),expires_at:i===2?time(3):null,is_pinned:i===0,access_mode:i===1?'preview_only':'preview_download',is_archived:false,uploaded_by:PRINCIPAL,uploader_name:'Demo Principal 001',created_at:time(-2),updated_at:time(-2)});
  });
  add('activity_logs','attendance',{action_type:'attendance_recorded',description:'Demo daily attendance recorded for all classes.',actor_name:'Demo Principal 001',created_at:time(0,'10:15')});
  return {marker:MARKER,project:PROJECT,school:SCHOOL,anchor,year,accounts,rows,publish,files};
}

// Minimal valid PDF, used only for fictional demo documents.
function demoPdf(title) {
  const stream=`BT /F1 16 Tf 50 760 Td (${title}) Tj 0 -28 Td /F1 11 Tf (NEPSOM demo document. Fictional data only.) Tj ET`;
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
  let pdf='%PDF-1.4\n';const offsets=[0];
  objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});
  const start=Buffer.byteLength(pdf);pdf+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(o=>`${String(o).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;return pdf;
}
