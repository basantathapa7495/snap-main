import { notFound } from 'next/navigation';
import AccountExperience from '../AccountExperience';
const sections=['profile','school','security','notifications'] as const;
export default async function AccountSection({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!sections.some(value=>value===section))notFound();return <AccountExperience section={section as typeof sections[number]}/>;}
