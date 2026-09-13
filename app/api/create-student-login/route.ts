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
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired session." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "A valid request body is required." },
      { status: 400 },
    );
  }

  const { email, password, studentId } = body as Record<string, unknown>;
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof studentId !== "string" ||
    !email.trim() ||
    password.length < 8
  ) {
    return NextResponse.json(
      { error: "A valid email, password, and student are required." },
      { status: 400 },
    );
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("school_id, role")
    .eq("user_id", user.id)
    .single();
  if (profileError || profile?.role !== "principal" || !profile.school_id) {
    return NextResponse.json(
      { error: "Only a principal can create student logins." },
      { status: 403 },
    );
  }

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, name, user_id")
    .eq("id", studentId)
    .eq("school_id", profile.school_id)
    .single();
  if (studentError || !student) {
    return NextResponse.json(
      { error: "Student not found in your school." },
      { status: 404 },
    );
  }
  if (student.user_id) {
    return NextResponse.json(
      { error: "This student already has a login." },
      { status: 409 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: student.name },
      app_metadata: { role: "student", school_id: profile.school_id },
    });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { error: updateError } = await admin
    .from("students")
    .update({ user_id: authUser.user.id, email: normalizedEmail })
    .eq("id", student.id)
    .eq("school_id", profile.school_id)
    .is("user_id", null)
    .select("id")
    .single();
  if (updateError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json(
      { error: "Failed to link the student account." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    userId: authUser.user.id,
  });
}
