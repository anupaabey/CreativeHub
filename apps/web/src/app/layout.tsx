import {BRAND_NAME} from '@/lib/brand';
import type {Metadata} from 'next';import './globals.css';import {Header} from '@/components/header';import {Footer} from '@/components/footer';
export const metadata:Metadata={title:{default:`${BRAND_NAME} — Creative talent, without limits`,template:`%s | ${BRAND_NAME}`},description:'Discover photographers, videographers, designers, editors and digital services professionals across Sri Lanka.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Header/>{children}<Footer/></body></html>}
