import { accounts, SCHOOL, MARKER, PROJECT } from './plan.mjs';

// Deployment-time capability is generated locally, expires in one hour and is
// removed by replacing this temporary function with a deny-all response.
// It cannot accept user IDs, school IDs, arbitrary data or arbitrary actions.
export function bootstrapSource(plan, capabilityHash, expiresAt) {
  return `import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
const accounts=${JSON.stringify(accounts)};
const files=${JSON.stringify(plan.files)};
const SCHOOL=${JSON.stringify(SCHOOL)}, MARKER=${JSON.stringify(MARKER)};
const allowedHash=${JSON.stringify(capabilityHash)}, expiresAt=${expiresAt};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async req=>{
  if(req.method!=='POST'||Date.now()>expiresAt)return json({error:'Bootstrap closed'},410);
  const candidate=req.headers.get('x-demo-bootstrap')||'';
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(candidate)))).map(b=>b.toString(16).padStart(2,'0')).join('');
  if(candidate.length!==64||hash!==allowedHash)return json({error:'Unauthorized'},401);
  if(Deno.env.get('SUPABASE_URL')!=='https://${PROJECT}.supabase.co')return json({error:'Wrong project'},403);
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  try {
    const all=[];for(let page=1;;page++){const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});if(error)throw error;all.push(...data.users);if(data.users.length<1000)break;}
    // Full preflight before creating any account. Never take over an existing email.
    for(const a of accounts){const existing=all.find(u=>u.id===a.id||u.email===a.email);if(existing&&(existing.id!==a.id||existing.email!==a.email||existing.app_metadata.demo_seed!==MARKER||existing.app_metadata.school_id!==SCHOOL||existing.app_metadata.role!==a.role||existing.app_metadata.approval_status!==a.status))throw new Error('Demo account ownership mismatch');}
    const credentials=[];
    for(const a of accounts){
      if(all.some(u=>u.id===a.id)){credentials.push({...a,existing:true});continue;}
      const password='Demo!'+Array.from(crypto.getRandomValues(new Uint8Array(18))).map(b=>b.toString(16).padStart(2,'0')).join('');
      const {error}=await admin.auth.admin.createUser({id:a.id,email:a.email,password,email_confirm:true,user_metadata:{full_name:a.name},app_metadata:{role:a.role,school_id:SCHOOL,approval_status:a.status,demo_seed:MARKER,must_change_password:false}});
      if(error)throw error;
      credentials.push({...a,password});
    }
    for(const file of files){
      if(!file.path.startsWith(SCHOOL+'/'))throw new Error('Invalid storage scope');
      const bytes=Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0));
      const result=await admin.storage.from('school-documents').upload(file.path,bytes,{contentType:'application/pdf',upsert:false});
      if(result.error&&!(result.error.statusCode==='409'||result.error.statusCode===409||result.error.message.includes('already exists')))throw result.error;
    }
    return json({school:SCHOOL,marker:MARKER,credentials,files:files.map(f=>f.path)});
  }catch(error){return json({error:error instanceof Error?error.message:String(error)},500);}
});`;
}

export const closedBootstrap = "Deno.serve(() => new Response('Demo bootstrap closed', { status: 410 }));";
