import { notFound } from "next/navigation";
import TeacherProfile from "../TeacherProfile";

const sections = [
  "personal",
  "professional",
  "security",
  "preferences",
] as const;
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections.includes(section as (typeof sections)[number])) notFound();
  return <TeacherProfile section={section as (typeof sections)[number]} />;
}
