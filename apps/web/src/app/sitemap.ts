import type {MetadataRoute} from 'next';
export default function sitemap():MetadataRoute.Sitemap{const base=process.env.SITE_URL??'http://localhost:3000';return ['','/explore','/about','/pricing','/help','/terms','/privacy'].map(path=>({url:`${base}${path}`,changeFrequency:'weekly',priority:path?0.6:1}));}
