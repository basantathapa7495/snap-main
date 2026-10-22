"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { refreshTeacherAvatarIn, teacherAvatarUrl } from "@/lib/teacher-avatars";

export default function TeacherAvatar({ name, path, scope, className = "" }: {
  name: string; path?: string | null; scope: string; className?: string;
}) {
  return <AvatarImage key={`${scope}:${path || ""}`} name={name} path={path} scope={scope} className={className} />;
}

function AvatarImage({ name, path, scope, className }: {
  name: string; path?: string | null; scope: string; className: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      const value = await teacherAvatarUrl(scope, path);
      if (!active) return;
      setUrl(value);
      if (path) timer = setTimeout(() => void load(), refreshTeacherAvatarIn(scope, path));
    }
    void load();
    return () => { active = false; clearTimeout(timer); };
  }, [scope, path]);

  return <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}>
    <span aria-hidden={loaded}>{name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
    {url && !broken && <Image unoptimized src={url} alt={`${name} profile picture`} fill sizes="64px" loading="lazy" className={`object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`} onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setBroken(true); }} />}
  </span>;
}
