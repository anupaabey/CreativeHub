import Workspace from '@/components/workspace';
import {notFound} from 'next/navigation';
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!['portfolio','services','bookings','messages','analytics','favorites','notifications','agency','settings','admin'].includes(section))notFound();return <Workspace section={section}/>;}
