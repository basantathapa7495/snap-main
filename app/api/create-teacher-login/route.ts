import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server authentication is not configured." },
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

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("school_id, role")
    .eq("user_id", user.id)
    .single();
  const role = profile?.role?.trim().toLowerCase();
  const canManageTeacherLogins =
    role === "principal" || role === "admin" || role === "school_admin";

  if (profileError) {
    return NextResponse.json(
      {
        error:
          "Your account profile could not be verified. Please sign out and sign in again.",
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

  const { data: teacher, error: teacherError } = await admin
    .from("teachers")
    .select("id, name, user_id")
    .eq("id", teacherId)
    .eq("school_id", profile.school_id)
    .single();
  if (teacherError || !teacher)
    return NextResponse.json(
      { error: "Teacher not found in your school." },
      { status: 404 },
    );
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

  const { error: updateError } = await admin
    .from("teachers")
    .update({ user_id: authUser.user.id, email: normalizedEmail })
    .eq("id", teacher.id)
    .eq("school_id", profile.school_id)
    .is("user_id", null)
    .select("id")
    .single();
  if (updateError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json(
      { error: "Failed to link the teacher account." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, userId: authUser.user.id });
}
