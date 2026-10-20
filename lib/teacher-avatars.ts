"use client";

import { supabase } from "@/lib/supabase";
import { AVATAR_URL_SECONDS, createTeacherAvatarCache } from "./teacher-avatar-cache";

const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`;
export const teacherAvatarCache = createTeacherAvatarCache({
  storage: () => typeof window === "undefined" ? null : window.sessionStorage,
  validUrl: (url) => url.startsWith(`${storageUrl}/object/sign/teacher-avatars/`),
  sign: async (paths, signal) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || signal.aborted) throw new Error("Sign in to load teacher photos.");
    // The Storage SDK's batch signing method has no AbortSignal option. This is
    // the same Storage endpoint, bearer token and RLS, with real cancellation.
    const response = await fetch(`${storageUrl}/object/sign/teacher-avatars`, {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paths, expiresIn: AVATAR_URL_SECONDS }),
      signal,
    });
    if (!response.ok) throw new Error("Teacher photo links are temporarily unavailable.");
    const data: { path: string | null; signedURL: string | null }[] = await response.json();
    return data.map((item) => ({ path: item.path, signedUrl: item.signedURL ? encodeURI(`${storageUrl}${item.signedURL}`) : null }));
  },
});

let currentUser = "";
export function activateTeacherAvatarCache(userId: string, schoolId: string) {
  currentUser = userId;
  const scope = `${userId}:${schoolId}`;
  teacherAvatarCache.activate(scope);
  return scope;
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || (currentUser && session?.user.id !== currentUser)) {
      currentUser = "";
      teacherAvatarCache.activate("");
    }
  });
}
