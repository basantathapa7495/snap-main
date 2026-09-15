import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey || !publishableKey) {
    return NextResponse.json(
      {
        error:
          "Teacher login setup is incomplete. Add SUPABASE_SECRET_KEY in Vercel.",
      },
      { status: 500 },
    );
  }

  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!token)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const authenticated = createClient(supabaseUrl, publishableKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);
  if (userError || !user)
    return NextResponse.json(
      { error: "Invalid or expired session." },
      { status: 401 },
    );

  const { email, password, teacherId } = await request.json();
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof teacherId !== "string" ||
    password.length < 8
  ) {
    return NextResponse.json(
      { error: "A valid email, password, and teacher are required." },
      { status: 400 },
    );
  }

  let { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("school_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  // Some projects restrict profile reads for server keys. Fall back to the
  // signed-in user's RLS-protected profile lookup before denying access.
  if (profileError || !profile) {
    const fallback = await authenticated
      .from("profiles")
      .select("school_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    profile = fallback.data;
    profileError = fallback.error;
  }

  const role = profile?.role?.trim().toLowerCase();
  const canManageTeacherLogins =
    role === "principal" || role === "admin" || role === "school_admin";

  if (profileError || !profile) {
    console.error("Teacher login profile verification failed", {
      code: profileError?.code,
      userId: user.id,
    });
    return NextResponse.json(
      {
        error:
          "SNAP could not load your school-admin profile. Check that the deployed Supabase keys belong to the same project.",
      },
      { status: 403 },
    );
  }
  if (!profile?.school_id) {
    return NextResponse.json(
      {
        error:
          "Your account is not linked to a school yet. Complete school setup first.",
      },
      { status: 403 },
    );
  }
  if (!canManageTeacherLogins) {
    return NextResponse.json(
      {
        error: `Your current role (${profile.role || "none"}) cannot create teacher logins.`,
      },
      { status: 403 },
    );
  }

  let { data: teacher, error: teacherError } = await admin
    .from("teachers")
    .select("id, name, phone, user_id")
    .eq("id", teacherId)
    .eq("school_id", profile.school_id)
    .maybeSingle();

  if (teacherError || !teacher) {
    const fallback = await authenticated
      .from("teachers")
      .select("id, name, phone, user_id")
      .eq("id", teacherId)
      .eq("school_id", profile.school_id)
      .maybeSingle();

    teacher = fallback.data;
    teacherError = fallback.error;
  }

  if (teacherError || !teacher) {
    console.error("Teacher login lookup failed", {
      code: teacherError?.code,
      teacherId,
      schoolId: profile.school_id,
    });
    return NextResponse.json(
      {
        error:
          "SNAP could not load this teacher record. Refresh the Teachers page and try again.",
      },
      { status: 404 },
    );
  }
  if (teacher.user_id)
    return NextResponse.json(
      { error: "This teacher already has a login." },
      { status: 409 },
    );

  const normalizedEmail = email.trim().toLowerCase();
  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: teacher.name },
      app_metadata: { role: "teacher", school_id: profile.school_id },
    });
  if (authError)
    return NextResponse.json({ error: authError.message }, { status: 400 });

  const teacherProfile = {
    user_id: authUser.user.id,
    school_id: profile.school_id,
    role: "teacher",
    full_name: teacher.name,
    phone: teacher.phone || null,
  };

  let { error: profileCreateError } = await admin
    .from("profiles")
    .insert(teacherProfile);

  // This project's server role may not have Data API table grants even though
  // it can manage Auth users. The verified principal session is an authorized,
  // school-scoped fallback for creating the matching portal profile.
  if (profileCreateError) {
    const fallback = await authenticated
      .from("profiles")
      .insert(teacherProfile);

    profileCreateError = fallback.error;
  }

  if (profileCreateError) {
    console.error("Teacher portal profile creation failed", {
      code: profileCreateError.code,
      message: profileCreateError.message,
      userId: authUser.user.id,
      schoolId: profile.school_id,
    });
    await admin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json(
      {
        error:
          "The teacher login could not be connected to a portal profile. Please try again.",
      },
      { status: 500 },
    );
  }

  let { error: updateError } = await admin
    .from("teachers")
    .update({ user_id: authUser.user.id, email: normalizedEmail })
    .eq("id", teacher.id)
    .eq("school_id", profile.school_id)
    .is("user_id", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    const fallback = await authenticated
      .from("teachers")
      .update({ user_id: authUser.user.id, email: normalizedEmail })
      .eq("id", teacher.id)
      .eq("school_id", profile.school_id)
      .is("user_id", null)
      .select("id")
      .maybeSingle();

    updateError = fallback.error;
  }

  if (updateError) {
    await admin.from("profiles").delete().eq("user_id", authUser.user.id);
    await admin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json(
      { error: "The login was created but could not be linked to the teacher record." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, userId: authUser.user.id });
}
