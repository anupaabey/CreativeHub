import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const categories: Record<string,string[]> = {
 Photography:['Weddings','Events','Portraits','Products','Fashion','Graduation','Real estate'],
 Videography:['Weddings','Commercials','Music videos','Events','Corporate productions','Social media reels'],
 Editing:['Video editing','Photo retouching','Color grading','Motion graphics','Short-form content editing'],
 'Graphic Design':['Branding','Logos','Posters','Social media designs','Packaging'],
 'Digital Marketing':['Social media management','Advertising campaigns','SEO','Content creation'],
 'Technology and Digital Services':['Website development','Software development','Mobile application development','UI/UX design','E-commerce development']
};
const districts = ['Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya'];
const slug = (s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
async function main(){
 const country=await prisma.country.upsert({where:{code:'LK'},update:{},create:{code:'LK',name:'Sri Lanka'}});
 for(const name of districts) await prisma.district.upsert({where:{countryId_name:{countryId:country.id,name}},update:{},create:{countryId:country.id,name}});
 for(const [name,children] of Object.entries(categories)){
  const parent=await prisma.category.upsert({where:{slug:slug(name)},update:{name},create:{slug:slug(name),name}});
  for(const child of children) await prisma.category.upsert({where:{slug:`${slug(name)}-${slug(child)}`},update:{},create:{slug:`${slug(name)}-${slug(child)}`,name:child,parentId:parent.id}});
 }
 for(const [code,name,priceMinor,monthlyCommissionBps] of [['FREE','Free',0,1000],['PRO','Creator Pro',199000,700],['BUSINESS','Creator Business',399000,500],['AGENCY','Agency',999000,500]] as const)
  await prisma.subscriptionPlan.upsert({where:{code},update:{name,priceMinor,monthlyCommissionBps},create:{code,name,priceMinor,monthlyCommissionBps}});
 console.log('Seeded country, 25 districts, categories and plans. No fake creator profiles or reviews.');
}
main().finally(()=>prisma.$disconnect());
