import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:['/','/explore','/creator/','/agency/'],disallow:['/dashboard/','/book/','/login','/register','/reset-password','/verify-email']},sitemap:`${process.env.SITE_URL??'http://localhost:3000'}/sitemap.xml`};}
