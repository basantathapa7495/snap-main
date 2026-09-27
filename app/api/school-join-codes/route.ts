import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { generateJoinCode, type JoinRole } from '@/lib/server/school-join-codes';

export const runtime = 'nodejs';

function response(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function principal(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!url || !key || !token) return null;
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user || ['pending', 'rejected'].includes(user.app_metadata?.approval_status)) return null;
  const { data: profile, error } = await admin.from('profiles').select('school_id,role').eq('user_id', user.id).maybeSingle();
  if (error || !profile?.school_id) return null;
  const role = String(profile.role || '').toLowerCase();
  if (!['principal', 'admin', 'school_admin', 'teacher'].includes(role)) return null;
  if (role === 'teacher') {
    const { data: teacher } = await admin.from('teachers').select('id').eq('school_id', profile.school_id).eq('user_id', user.id).maybeSingle();
    if (!teacher) return null;
  }
  return { admin, schoolId: profile.school_id, role };
}

export async function GET(request: Request) {
  const context = await principal(request);
  if (!context) return response({ error: 'Authorized school account required.' }, 401);
  const { data, error } = await context.admin.from('school_join_settings')
    .select(context.role === 'teacher' ? 'school_code,student_join_code,student_join_enabled' : 'school_code,teacher_join_code,student_join_code,teacher_join_enabled,student_join_enabled')
    .eq('school_id', context.schoolId).single();
  if (error) { console.error('School join settings load failed', error); return response({ error: 'Join codes could not be loaded.' }, 500); }
  return response({ codes: data });
}

export async function PATCH(request: Request) {
  const context = await principal(request);
  if (!context) return response({ error: 'Authorized school account required.' }, 401);
  const origin = request.headers.get('origin');
  try {
    if (origin && new URL(origin).host !== new URL(request.url).host) return response({ error: 'Request origin is not allowed.' }, 403);
  } catch { return response({ error: 'Request origin is not allowed.' }, 403); }

  let body: { role?: unknown; action?: unknown; enabled?: unknown };
  try { body = await request.json() as typeof body; } catch { return response({ error: 'A valid request is required.' }, 400); }
  if (body.role !== 'teacher' && body.role !== 'student') return response({ error: 'Choose teacher or student.' }, 400);
  const role: JoinRole = body.role;
  if (context.role === 'teacher' && role !== 'student') return response({ error: 'Only principals can manage teacher joining.' }, 403);
  const codeColumn = role === 'teacher' ? 'teacher_join_code' : 'student_join_code';
  const enabledColumn = role === 'teacher' ? 'teacher_join_enabled' : 'student_join_enabled';

  if (body.action === 'set-enabled') {
    if (typeof body.enabled !== 'boolean') return response({ error: 'An enabled setting is required.' }, 400);
    const { error } = await context.admin.from('school_join_settings')
      .update({ [enabledColumn]: body.enabled }).eq('school_id', context.schoolId);
    if (error) { console.error('School join setting update failed', error); return response({ error: 'Join setting could not be updated.' }, 500); }
    return response({ success: true, role, enabled: body.enabled });
  }

  if (body.action !== 'regenerate') return response({ error: 'Choose a supported action.' }, 400);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: current, error: readError } = await context.admin.from('school_join_settings')
      .select('school_code,teacher_join_code,student_join_code').eq('school_id', context.schoolId).single();
    if (readError || !current) { console.error('School join code load failed', readError); return response({ error: 'Join codes could not be loaded.' }, 500); }

    const next = generateJoinCode([current.school_code, current.teacher_join_code, current.student_join_code]);
    const { data: updated, error } = await context.admin.from('school_join_settings')
      .update({ [codeColumn]: next }).eq('school_id', context.schoolId)
      .eq(codeColumn, current[codeColumn]).select(codeColumn).maybeSingle();
    if (error) { console.error('School join code rotation failed', error); return response({ error: 'Join code could not be regenerated.' }, 500); }
    if (updated) return response({ success: true, role, joinCode: next });
  }
  return response({ error: 'Join code changed during regeneration. Try again.' }, 409);
}
