"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { teacherAvatarCache } from "@/lib/teacher-avatars";

export default function TeacherAvatar({ name, path, scope, className = "" }: {
  name: string; path?: string | null; scope: string; className?: string;
}) {
  return <AvatarImage key={`${scope}:${path || ""}`} name={name} path={path} scope={scope} className={className} />;
}

function AvatarImage({ name, path, scope, className }: {
  name: string; path?: string | null; scope: string; className: string;
}) {
  const host = useRef<HTMLSpanElement>(null);
  const [url, setUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const imageRetries = useRef(0);

  useEffect(() => {
    if (!path || !scope || !host.current) return;
    let active = true;
    let visible = false;
    let refresh: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      if (!visible || !active) return;
      const next = await teacherAvatarCache.get(scope, path!);
      if (!active) return;
      setUrl(next || "");
      clearTimeout(refresh);
      // Renew links before expiry without polling or refetching teacher records.
      refresh = setTimeout(() => void load(), teacherAvatarCache.refreshIn(scope, path!));
    }
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) void load();
    });
    if (observer) observer.observe(host.current);
    else { visible = true; void load(); }
    const retry = () => { if (visible) void load(); };
    window.addEventListener("online", retry);
    return () => { active = false; observer?.disconnect(); clearTimeout(refresh); window.removeEventListener("online", retry); };
  }, [path, scope]);

  return <span ref={host} className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}>
    <span aria-hidden={loaded}>{name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
    {url && <Image unoptimized src={url} alt={`${name} profile picture`} fill sizes="64px" loading="lazy" className={`object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`} onLoad={() => setLoaded(true)} onError={() => {
      setLoaded(false);
      if (!path || imageRetries.current++ > 0) { setUrl(""); return; }
      teacherAvatarCache.invalidate(path);
      void teacherAvatarCache.get(scope, path).then((next) => setUrl(next || ""));
    }} />}
  </span>;
}
