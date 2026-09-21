import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type RequestBody = {
  schoolSlug?: unknown;
  role?: unknown;
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
  phone?: unknown;
  subject?: unknown;
  qualification?: unknown;
  studentClass?: unknown;
  section?: unknown;
  rollNo?: unknown;
  parentName?: unknown;
  parentPhone?: unknown;
};

const clean = (value: unknown, max = 120) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: 'Account requests are not configured.' }, { status: 500 });

  const origin = request.headers.get('origin');
  try {
    if (origin && new URL(origin).host !== new URL(request.url).host) return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  } catch {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }

  let body: RequestBody;
  try { body = await request.json() as RequestBody; } catch { return NextResponse.json({ error: 'A valid request body is required.' }, { status: 400 }); }

  const schoolSlug = clean(body.schoolSlug, 100).toLowerCase();
  const role = clean(body.role, 20).toLowerCase();
  const fullName = clean(body.fullName);
  const email = clean(body.email, 180).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const phone = clean(body.phone, 30);
  if (!schoolSlug || !['teacher', 'student'].includes(role) || fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return NextResponse.json({ error: 'School, role, full name, valid email and an 8-character password are required.' }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: school } = await admin.from('schools').select('id,name').eq('slug', schoolSlug).eq('is_approved', true).maybeSingle();
  if (!school) return NextResponse.json({ error: 'This school is unavailable for registration.' }, { status: 404 });

  const { data: existing } = await admin.from('account_requests').select('id').eq('school_id', school.id).eq('email', email).eq('requested_role', role).eq('status', 'pending').maybeSingle();
  if (existing) return NextResponse.json({ error: 'A pending request already exists for this email.' }, { status: 409 });

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { role: 'pending', requested_role: role, school_id: school.id, approval_status: 'pending' },
  });
  if (authError || !authUser.user) return NextResponse.json({ error: authError?.message || 'The account request could not be created.' }, { status: 400 });

  const payload = {
    school_id: school.id,
    auth_user_id: authUser.user.id,
    requested_role: role,
    full_name: fullName,
    email,
    phone: phone || null,
    subject: role === 'teacher' ? clean(body.subject) || null : null,
    qualification: role === 'teacher' ? clean(body.qualification) || null : null,
    class: role === 'student' ? clean(body.studentClass, 40) || null : null,
    section: role === 'student' ? clean(body.section, 20) || null : null,
    roll_no: role === 'student' ? clean(body.rollNo, 30) || null : null,
    parent_name: role === 'student' ? clean(body.parentName) || null : null,
    parent_phone: role === 'student' ? clean(body.parentPhone, 30) || null : null,
  };
  const { error: insertError } = await admin.from('account_requests').insert(payload);
  if (insertError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: 'The request could not be saved. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, schoolName: school.name });
}
