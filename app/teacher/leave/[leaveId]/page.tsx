import TeacherLeave from '../TeacherLeave';
export default async function Page({params}:{params:Promise<{leaveId:string}>}){return <TeacherLeave mode="detail" leaveId={(await params).leaveId}/>}
