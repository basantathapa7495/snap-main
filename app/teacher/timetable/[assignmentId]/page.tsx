import PeriodDetails from './PeriodDetails';

export default async function Page({params}:{params:Promise<{assignmentId:string}>}) {
  return <PeriodDetails assignmentId={(await params).assignmentId}/>;
}
