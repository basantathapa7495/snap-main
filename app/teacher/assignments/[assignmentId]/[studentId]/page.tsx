import TeacherAssignments from '../../TeacherAssignments';
export default async function Page({params}:{params:Promise<{assignmentId:string;studentId:string}>}){const p=await params;return <TeacherAssignments mode="submission" assignmentId={p.assignmentId} studentId={p.studentId}/>}
