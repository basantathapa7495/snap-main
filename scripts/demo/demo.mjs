import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import { randomBytes, createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { createPlan, PROJECT, SCHOOL, MARKER, accounts } from './plan.mjs';
import { seedSql } from './sql.mjs';
import { bootstrapSource } from './bootstrap.mjs';

const directory = new URL('../../.demo-runtime/', import.meta.url);
const local = file => new URL(file,directory);
const command = process.argv[2] || 'help';
async function save(file,value) { await writeFile(local(file),value,{mode:0o600}); await chmod(local(file),0o600); }
async function plan() {
  try { return JSON.parse(await readFile(local('plan.json'),'utf8')); }
  catch(error) { if(error.code!=='ENOENT')throw error; throw Object.assign(new Error('Run plan first.'), {code:'ENOENT'}); }
}
if(command==='plan') {
  await mkdir(directory,{recursive:true,mode:0o700});
  let p;try{p=await plan();}catch(error){if(error.code!=='ENOENT')throw error;p=createPlan(process.argv[3]||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kathmandu',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));}
  await save('plan.json',JSON.stringify(p));
  await save('seed.sql',seedSql(p));await save('reset.sql',seedSql(p,true));
  console.log(JSON.stringify({school:SCHOOL,anchor:p.anchor,year:p.year,counts:Object.fromEntries(Object.entries(p.rows).map(([table,rows])=>[table,rows.length]))},null,2));
} else if(command==='bootstrap-source') {
  const p=await plan(),capability=randomBytes(32).toString('hex');
  await save('bootstrap-capability',capability);
  await save('bootstrap.ts',bootstrapSource(p,createHash('sha256').update(capability).digest('hex'),Date.now()+3600000));
  console.log('Created expiring, fixed-scope bootstrap source. Deploy only temporarily; close it immediately after Auth provisioning.');
} else if(command==='auth') {
  const p=await plan(),url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
  if(url!==`https://${PROJECT}.supabase.co`||!key)throw new Error('Set the exact project SUPABASE_URL and a server-only Admin API key.');
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const existing=[];for(let page=1;;page++){const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});if(error)throw error;existing.push(...data.users);if(data.users.length<1000)break;}
  for(const a of accounts){const u=existing.find(u=>u.id===a.id||u.email===a.email);if(u&&(u.id!==a.id||u.email!==a.email||u.app_metadata.demo_seed!==MARKER||u.app_metadata.school_id!==SCHOOL||u.app_metadata.role!==a.role||u.app_metadata.approval_status!==a.status))throw new Error('Demo Auth ownership mismatch');}
  let saved=[];try{saved=JSON.parse(await readFile(local('credentials.json'),'utf8')).credentials;}catch{}
  for(const a of accounts){
    if(existing.some(u=>u.id===a.id))continue;
    const password=`Demo!${randomBytes(18).toString('hex')}`;
    const {error}=await admin.auth.admin.createUser({id:a.id,email:a.email,password,email_confirm:true,user_metadata:{full_name:a.name},app_metadata:{role:a.role,school_id:SCHOOL,approval_status:a.status,demo_seed:MARKER,must_change_password:false}});if(error)throw error;
    saved.push({...a,password});await save('credentials.json',JSON.stringify({school:SCHOOL,credentials:saved},null,2));
  }
  for(const f of p.files){const {error}=await admin.storage.from('school-documents').upload(f.path,Buffer.from(f.base64,'base64'),{contentType:'application/pdf',upsert:false});if(error&&String(error.statusCode)!=='409'&&!error.message.includes('already exists'))throw error;}
  console.log('Demo Auth accounts and real demo PDFs provisioned. Credentials are in the private, ignored .demo-runtime/credentials.json file.');
} else if(command==='seed'||command==='reset') {
  if(command==='reset'&&process.env.NEPSOM_RESET_DEMO!==MARKER)throw new Error(`Reset requires NEPSOM_RESET_DEMO=${MARKER}`);
  if(!process.env.DEMO_DATABASE_URL)throw new Error('Set DEMO_DATABASE_URL to this project administrator connection URL.');
  const p=await plan();await save(`${command}.sql`,seedSql(p,command==='reset'));
  // Pass connection URL through the subprocess environment, not command args.
  const result=spawnSync('psql',['--no-psqlrc','--set','ON_ERROR_STOP=1','--file',local(`${command}.sql`).pathname],{env:{...process.env,PGDATABASE:process.env.DEMO_DATABASE_URL},stdio:'inherit'});
  if(result.error)throw result.error;if(result.status)process.exit(result.status);
} else {
  console.log('Commands: plan [YYYY-MM-DD], auth, seed, reset, bootstrap-source. See docs/demo-school.md.');
}
