import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password, teacherId, schoolId } = await request.json();

  // Create admin client with service role key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Create auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'teacher', school_id: schoolId }
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // 2. Update teacher record with user_id
  const { error: updateError } = await supabaseAdmin
    .from('teachers')
    .update({ user_id: authUser.user.id })
    .eq('id', teacherId);

  if (updateError) {
    // Rollback: delete the auth user
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: 'Failed to link teacher account' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    userId: authUser.user.id,
    email,
    password 
  });
}