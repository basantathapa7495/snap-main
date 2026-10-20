"use client";

import { supabase } from "@/lib/supabase";
import { AVATAR_URL_SECONDS, createTeacherAvatarCache } from "./teacher-avatar-cache";

const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`;
const headers = (token: string) => ({
  apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

async function signOne(path: string, token: string, signal: AbortSignal) {
  try {
    const response = await fetch(`${storageUrl}/object/sign/teacher-avatars/${path}`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ expiresIn: AVATAR_URL_SECONDS }),
      signal,
    });
    if (!response.ok) return { path, signedUrl: null };
    const item: { signedURL?: string } = await response.json();
    return { path, signedUrl: item.signedURL ? encodeURI(`${storageUrl}${item.signedURL}`) : null };
  } catch {
    if (signal.aborted) throw new DOMException("Avatar request aborted", "AbortError");
    return { path, signedUrl: null };
  }
}

export const teacherAvatarCache = createTeacherAvatarCache({
  storage: () => typeof window === "undefined" ? null : window.sessionStorage,
  validUrl: (url) => url.startsWith(`${storageUrl}/object/sign/teacher-avatars/`),
  sign: async (paths, signal) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || signal.aborted) throw new Error("Sign in to load teacher photos.");
    // The project's multi-object signing endpoint can hang until the browser
    // aborts it. Sign only visible objects and keep concurrency low. Each call
    // still uses the user's bearer token and the existing Storage RLS policy.
    const results: { path: string; signedUrl: string | null }[] = [];
    for (let index = 0; index < paths.length; index += 2) {
      results.push(...await Promise.all(paths.slice(index, index + 2).map((path) =>
        signOne(path, session.access_token, signal))));
    }
    return results;
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
