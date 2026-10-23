"use client";

import { supabase } from "@/lib/supabase";

const origin = process.env.NEXT_PUBLIC_TEACHER_IMAGE_ORIGIN || "https://images.nepsom.xyz";

async function authorization() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error("Sign in again to manage your profile picture.");
  return { Authorization: `Bearer ${session.access_token}` };
}

async function request(path: string, method: "PUT" | "DELETE", file?: File) {
  let response: Response;
  try {
    response = await fetch(`${origin}/object/${path}`, {
      method,
      headers: { ...await authorization(), ...(file ? { "Content-Type": "image/webp" } : {}) },
      body: file,
    });
  } catch {
    throw new Error("Photo service could not be reached. Check your connection and try again.");
  }
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error || `Photo service returned ${response.status}.`);
  }
}

export async function uploadProfileAvatar(path: string, photo: File) {
  await request(path, "PUT", photo);
}

export async function removeProfileAvatar(path: string) {
  await request(path, "DELETE");
}

export async function profileAvatarUrl(path?: string | null) {
  if (!path) return null;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${origin}/sign`, {
      method: "POST",
      headers: { ...await authorization(), "Content-Type": "application/json" },
      body: JSON.stringify({ paths: [path] }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Could not load profile picture (${response.status}).`);
    const result: { urls: { path: string; signedUrl: string }[] } = await response.json();
    return result.urls.find((entry) => entry.path === path)?.signedUrl || null;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Profile picture service timed out.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
