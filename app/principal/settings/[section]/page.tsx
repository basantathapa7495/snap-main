import {notFound} from 'next/navigation';
import SettingsExperience from '../SettingsExperience';
const sections=['features','academics','notifications','security','system'] as const;
export default async function SettingsSectionPage({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!sections.includes(section as typeof sections[number]))notFound();return <SettingsExperience section={section as typeof sections[number]}/>;}
