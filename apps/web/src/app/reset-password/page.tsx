import {Suspense} from 'react';
import Recovery from '@/components/recovery-form';
export default function Page(){return <Suspense fallback={<p>Loading…</p>}><Recovery mode='reset-password'/></Suspense>;}
