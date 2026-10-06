import TeacherMarks from "../TeacherMarks";
export default async function Page({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  return <TeacherMarks view="entry" subjectId={subjectId} />;
}
