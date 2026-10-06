import TeacherMarks from "../../TeacherMarks";
export default async function Page({
  params,
}: {
  params: Promise<{ subjectId: string; studentId: string }>;
}) {
  const { subjectId, studentId } = await params;
  return (
    <TeacherMarks view="student" subjectId={subjectId} studentId={studentId} />
  );
}
