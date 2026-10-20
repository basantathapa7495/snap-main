"use client";

import Image from "next/image";
import { useState } from "react";
import { teacherAvatarUrl } from "@/lib/teacher-avatars";

export default function TeacherAvatar({ name, path, scope, className = "" }: {
  name: string; path?: string | null; scope: string; className?: string;
}) {
  return <AvatarImage key={`${scope}:${path || ""}`} name={name} path={path} className={className} />;
}

function AvatarImage({ name, path, className }: {
  name: string; path?: string | null; className: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);
  const url = teacherAvatarUrl(path);

  return <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}>
    <span aria-hidden={loaded}>{name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
    {url && !broken && <Image unoptimized src={url} alt={`${name} profile picture`} fill sizes="64px" loading="lazy" className={`object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`} onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setBroken(true); }} />}
  </span>;
}
