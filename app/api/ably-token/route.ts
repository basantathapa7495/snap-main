import { Rest } from "ably";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ablyKey = process.env.ABLY_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!ablyKey || !supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Realtime messaging is not configured." }, { status: 503 });
  }

  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!accessToken) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let body: { conversationId?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const conversationId = body.conversationId?.trim();
  if (!conversationId) return NextResponse.json({ error: "Conversation required." }, { status: 400 });

  const scoped = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: { user }, error: authError } = await scoped.auth.getUser(accessToken);
  if (authError || !user) return NextResponse.json({ error: "Session expired." }, { status: 401 });

  // This query intentionally uses the caller's JWT. Existing RLS is the authority
  // that decides whether the user belongs to this exact conversation.
  const { data: conversation, error: conversationError } = await scoped
    .from("direct_conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle();
  if (conversationError || !conversation) {
    return NextResponse.json({ error: "Conversation access denied." }, { status: 403 });
  }

  try {
    const ably = new Rest({ key: ablyKey });
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: user.id,
      ttl: 60 * 60 * 1000,
      capability: JSON.stringify({
        [`nepsom:direct:${conversationId}`]: ["publish", "subscribe"],
      }),
    });
    return NextResponse.json(tokenRequest, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Ably token creation failed", error);
    return NextResponse.json({ error: "Realtime authorization unavailable." }, { status: 503 });
  }
}
