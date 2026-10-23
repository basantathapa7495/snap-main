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

type CachedAvatar = { url: string; expiresAt: number };
const memory = new Map<string, CachedAvatar>();
const pending = new Map<string, Promise<string | null>>();
const cacheKey = (path: string) => `nepsom:profile-avatar:v1:${path}`;

function validCached(value: CachedAvatar | null | undefined) {
  return Boolean(value?.url && value.expiresAt > Date.now() + 60_000);
}

export function cachedProfileAvatarUrl(path?: string | null) {
  if (!path) return null;
  const inMemory = memory.get(path);
  if (validCached(inMemory)) return inMemory!.url;
  try {
    const stored: CachedAvatar | null = JSON.parse(sessionStorage.getItem(cacheKey(path)) || "null");
    if (validCached(stored)) {
      memory.set(path, stored!);
      return stored!.url;
    }
    sessionStorage.removeItem(cacheKey(path));
  } catch { /* Signing still works when browser storage is unavailable. */ }
  return null;
}

function remember(path: string, url: string) {
  const value = { url, expiresAt: Date.now() + 50 * 60 * 1000 };
  memory.set(path, value);
  try { sessionStorage.setItem(cacheKey(path), JSON.stringify(value)); } catch { /* Memory cache remains available. */ }
}

export function profileAvatarUrl(path?: string | null) {
  if (!path) return Promise.resolve(null);
  const cached = cachedProfileAvatarUrl(path);
  if (cached) return Promise.resolve(cached);
  const existing = pending.get(path);
  if (existing) return existing;

  const task = (async () => {
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
      const url = result.urls.find((entry) => entry.path === path)?.signedUrl || null;
      if (url) remember(path, url);
      return url;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Profile picture service timed out.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  })().finally(() => pending.delete(path));

  pending.set(path, task);
  return task;
}
