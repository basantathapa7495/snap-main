import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type PendingSchool = {
  name?: unknown;
  slug?: unknown;
  province?: unknown;
  district?: unknown;
  municipality?: unknown;
  ward?: unknown;
  school_type?: unknown;
  school_level?: unknown;
  phone?: unknown;
  principal?: unknown;
  school_email?: unknown;
  pan_number?: unknown;
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey || !publishableKey) {
    return NextResponse.json(
      { error: 'School setup is incomplete. Add SUPABASE_SECRET_KEY in Vercel.' },
      { status: 500 },
    );
  }

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const authenticated = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
  }

  let { data: existingProfile, error: existingError } = await admin
    .from('profiles')
    .select('role, school_id')
    .eq('user_id', user.id)
    .maybeSingle();

  // Some Supabase secret-key configurations do not bypass table RLS for reads.
  // Retry as the verified signed-in user, who may read their own profile.
  if (existingError) {
    const fallback = await authenticated
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .maybeSingle();
    existingProfile = fallback.data;
    existingError = fallback.error;
  }

  if (existingError) {
    console.error('School profile check failed', {
      code: existingError.code,
      message: existingError.message,
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Could not check your school profile. Please sign out, sign in and try again.' },
      { status: 500 },
    );
  }
  if (existingProfile?.school_id) {
    return NextResponse.json(existingProfile);
  }

  const pending = user.user_metadata?.pending_school as PendingSchool | undefined;
  const name = typeof pending?.name === 'string' ? pending.name.trim() : '';
  const requestedSlug = typeof pending?.slug === 'string' ? pending.slug.trim() : '';
  if (!name || !requestedSlug) {
    return NextResponse.json(
      { error: 'Your registration details are missing. Please register the school again.' },
      { status: 400 },
    );
  }

  const safe = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null;
  let slug = requestedSlug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  const { data: slugOwner } = await admin.from('schools').select('id').eq('slug', slug).maybeSingle();
  if (slugOwner) slug = `${slug}-${user.id.slice(0, 6)}`;

  const schoolRow = {
    name,
    slug,
    province: safe(pending?.province),
    district: safe(pending?.district),
    municipality: safe(pending?.municipality),
    ward: safe(pending?.ward),
    school_type: safe(pending?.school_type),
    school_level: safe(pending?.school_level),
    phone: safe(pending?.phone),
    principal: safe(pending?.principal) || safe(user.user_metadata?.full_name),
    school_email: safe(pending?.school_email),
    pan_number: safe(pending?.pan_number),
    is_approved: false,
  };

  const { data: school, error: schoolError } = await admin
    .from('schools')
    .insert(schoolRow)
    .select('id')
    .single();

  if (schoolError || !school) {
    console.error('School workspace creation failed', { code: schoolError?.code, userId: user.id });
    return NextResponse.json(
      { error: schoolError?.message || 'Could not create your school workspace.' },
      { status: 400 },
    );
  }

  const fullName = safe(user.user_metadata?.full_name) || schoolRow.principal || '';
  const { error: profileError } = await admin.from('profiles').insert({
    user_id: user.id,
    school_id: school.id,
    role: 'admin',
    full_name: fullName,
  });

  if (profileError) {
    await admin.from('schools').delete().eq('id', school.id);
    return NextResponse.json(
      { error: 'Could not connect the principal account to the new school.' },
      { status: 400 },
    );
  }

  const level = schoolRow.school_level || '';
  const numbers =
    level === 'Primary' ? [1, 2, 3, 4, 5] :
    level === 'Basic' ? [1, 2, 3, 4, 5, 6, 7, 8] :
    level === 'Secondary' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] :
    level === 'Higher Secondary' ? [11, 12] : [];

  if (numbers.length) {
    const { error: classError } = await admin.from('classes').insert(
      numbers.map((number) => ({
        school_id: school.id,
        class_number: String(number),
        section_name: null,
        class_name: `Class ${number}`,
        name: `Class ${number}`,
      })),
    );
    if (classError) console.error('Default class creation failed', { code: classError.code, schoolId: school.id });
  }

  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, role: 'admin', school_id: school.id },
    user_metadata: { ...user.user_metadata, pending_school: null },
  });

  return NextResponse.json({ role: 'admin', school_id: school.id });
}
