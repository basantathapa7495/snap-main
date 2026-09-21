import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function clients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  return {
    admin: createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } }),
  };
}

async function authorize(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const available = clients();
  if (!available) return null;
  const { data: { user } } = await available.admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await available.admin.from('profiles').select('school_id,role').eq('user_id', user.id).maybeSingle();
  if (!profile?.school_id) return null;
  return { ...available, user, profile, role: String(profile.role || '').toLowerCase() };
}

export async function GET(request: Request) {
  const context = await authorize(request);
  if (!context) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const requestedRole = new URL(request.url).searchParams.get('role') === 'teacher' ? 'teacher' : 'student';
  const isPrincipal = ['admin', 'principal', 'school_admin'].includes(context.role);
  if (!isPrincipal && !(context.role === 'teacher' && requestedRole === 'student')) return NextResponse.json({ error: 'You cannot review these requests.' }, { status: 403 });
  const { data, error } = await context.admin.from('account_requests').select('id,requested_role,full_name,email,phone,subject,qualification,class,section,roll_no,parent_name,parent_phone,status,created_at').eq('school_id', context.profile.school_id).eq('requested_role', requestedRole).eq('status', 'pending').order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: 'Requests could not be loaded.' }, { status: 500 });
  return NextResponse.json({ requests: data || [] });
}

export async function PATCH(request: Request) {
  const context = await authorize(request);
  if (!context) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  let body: { requestId?: unknown; action?: unknown };
  try { body = await request.json() as typeof body; } catch { return NextResponse.json({ error: 'A valid request body is required.' }, { status: 400 }); }
  const requestId = typeof body.requestId === 'string' ? body.requestId : '';
  const action = body.action === 'approve' || body.action === 'reject' ? body.action : '';
  if (!requestId || !action) return NextResponse.json({ error: 'Request and action are required.' }, { status: 400 });

  const { data: accountRequest } = await context.admin.from('account_requests').select('*').eq('id', requestId).eq('school_id', context.profile.school_id).eq('status', 'pending').maybeSingle();
  if (!accountRequest) return NextResponse.json({ error: 'Pending request not found.' }, { status: 404 });
  const isPrincipal = ['admin', 'principal', 'school_admin'].includes(context.role);
  if (!isPrincipal && !(context.role === 'teacher' && accountRequest.requested_role === 'student')) return NextResponse.json({ error: 'You cannot review this request.' }, { status: 403 });

  if (action === 'reject') {
    const { error } = await context.admin.from('account_requests').update({ status: 'rejected', reviewed_by: context.user.id, reviewed_at: new Date().toISOString() }).eq('id', accountRequest.id).eq('status', 'pending');
    if (error) return NextResponse.json({ error: 'The request could not be rejected.' }, { status: 500 });
    await context.admin.auth.admin.deleteUser(accountRequest.auth_user_id);
    return NextResponse.json({ success: true });
  }

  const targetTable = accountRequest.requested_role === 'teacher' ? 'teachers' : 'students';
  const personResult = accountRequest.requested_role === 'teacher'
    ? await context.admin.from('teachers').insert({
      school_id: context.profile.school_id, name: accountRequest.full_name, email: accountRequest.email, phone: accountRequest.phone,
      subject: accountRequest.subject, qualification: accountRequest.qualification, user_id: accountRequest.auth_user_id,
    })
    : await context.admin.from('students').insert({
      school_id: context.profile.school_id, name: accountRequest.full_name, email: accountRequest.email, parent_phone: accountRequest.parent_phone,
      parent_name: accountRequest.parent_name, class: accountRequest.class, section: accountRequest.section, roll_no: accountRequest.roll_no, user_id: accountRequest.auth_user_id,
    });
  const personError = personResult.error;
  if (personError) return NextResponse.json({ error: `The ${accountRequest.requested_role} record could not be created.` }, { status: 500 });
  const { error: profileError } = await context.admin.from('profiles').insert({ user_id: accountRequest.auth_user_id, school_id: context.profile.school_id, role: accountRequest.requested_role, full_name: accountRequest.full_name, phone: accountRequest.phone || accountRequest.parent_phone || null });
  if (profileError) {
    await context.admin.from(targetTable).delete().eq('user_id', accountRequest.auth_user_id);
    return NextResponse.json({ error: 'The portal profile could not be created.' }, { status: 500 });
  }
  const { data: authData } = await context.admin.auth.admin.getUserById(accountRequest.auth_user_id);
  const { error: authError } = await context.admin.auth.admin.updateUserById(accountRequest.auth_user_id, { app_metadata: { ...(authData.user?.app_metadata || {}), role: accountRequest.requested_role, school_id: context.profile.school_id, approval_status: 'approved' } });
  if (authError) {
    await context.admin.from('profiles').delete().eq('user_id', accountRequest.auth_user_id);
    await context.admin.from(targetTable).delete().eq('user_id', accountRequest.auth_user_id);
    return NextResponse.json({ error: 'Portal access could not be activated.' }, { status: 500 });
  }
  const { error: requestError } = await context.admin.from('account_requests').update({ status: 'approved', reviewed_by: context.user.id, reviewed_at: new Date().toISOString() }).eq('id', accountRequest.id).eq('status', 'pending');
  if (requestError) return NextResponse.json({ error: 'Access was activated, but request status could not be updated.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
