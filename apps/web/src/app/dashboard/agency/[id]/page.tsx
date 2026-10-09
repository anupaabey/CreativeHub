import AgencyWorkspace from '@/components/agency-workspace';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AgencyWorkspace id={id}/>;}
