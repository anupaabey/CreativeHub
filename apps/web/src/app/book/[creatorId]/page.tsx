import {Suspense} from 'react';
import BookingRequest from '@/components/booking-request';
export default async function Page({params}:{params:Promise<{creatorId:string}>}){const {creatorId}=await params;return <Suspense fallback={<p>Loading…</p>}><BookingRequest creatorId={creatorId}/></Suspense>;}
