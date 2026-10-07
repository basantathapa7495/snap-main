import TeacherAssignments from '../TeacherAssignments';
export default async function Page({params}:{params:Promise<{assignmentId:string}>}){return <TeacherAssignments mode="detail" assignmentId={(await params).assignmentId}/>}
