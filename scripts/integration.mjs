import assert from 'node:assert/strict';
import {PrismaClient} from '@prisma/client';
const db=new PrismaClient();const base=process.env.TEST_API_URL??'http://localhost:4000/api/v1';const origin=process.env.WEB_URL??'http://localhost:3000';
let checks=0;
async function call(path,data,cookie='',method=data?'POST':'GET',expected=200,extra={}){const response=await fetch(`${base}${path}`,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,...extra},...(data?{body:JSON.stringify(data)}:{})});const result=await response.json();assert.equal(response.status,expected,`${method} ${path}: ${JSON.stringify(result)}`);checks++;return {data:result,cookie:response.headers.get('set-cookie')?.split(';')[0]??cookie};}
try{
 const suffix=Date.now().toString(36);const password='test-password-12345';
 const customer=await call('/auth/register',{name:'Integration Customer',email:`customer-${suffix}@example.test`,password},'','POST',201);
 const provider=await call('/auth/register',{name:'Integration Creator',email:`creator-${suffix}@example.test`,password},'','POST',201);
 const stranger=await call('/auth/register',{name:'Integration Stranger',email:`stranger-${suffix}@example.test`,password},'','POST',201);
 const c=(await call('/auth/become-creator',{username:`test-${suffix}`,headline:'Integration test provider'},provider.cookie,'POST',201)).data;
 await call('/workspace/profile',{bio:'Integration test profile',published:true},provider.cookie,'PATCH');
 await call('/workspace/portfolio',{title:'Permission check',description:'Draft only',clientConsent:false,visibility:'PUBLIC'},provider.cookie,'POST',400);
 await call('/workspace/portfolio',{title:'Integration portfolio',description:'Test project with consent',clientConsent:true,visibility:'PUBLIC'},provider.cookie,'POST',201);
 const categories=(await call('/categories')).data;
 const service=(await call('/workspace/services',{categoryId:categories[0].id,title:'Integration editing',description:'Test deliverables',isRemote:true,published:true,priceMinor:'1000000',revisions:1,durationDays:7},provider.cookie,'POST',201)).data;
 const booking=(await call('/workspace/bookings',{creatorId:c.id,packageId:service.packages[0].id,title:'Integration project',details:'Create a short edited video for this integration test.'},customer.cookie,'POST',201)).data;
 await call(`/workspace/bookings/${booking.id}`,undefined,stranger.cookie,'GET',403);
 await call(`/workspace/bookings/${booking.id}/messages`,{text:'Private requirements'},customer.cookie,'POST',201);
 await call(`/workspace/bookings/${booking.id}/messages`,undefined,stranger.cookie,'GET',403);
 await call(`/workspace/bookings/${booking.id}/quote`,{amountMinor:'1000000',description:'One edited video, one revision.',expiresAt:new Date(Date.now()+86400000).toISOString()},provider.cookie,'POST',201);
 await call(`/workspace/bookings/${booking.id}/action`,{status:'AWAITING_PAYMENT'},provider.cookie,'POST',403);
 await call(`/workspace/bookings/${booking.id}/action`,{status:'AWAITING_PAYMENT'},customer.cookie,'POST',201);
 const headers={'Idempotency-Key':`integration_${booking.id}`};
 const payment=await call(`/workspace/bookings/${booking.id}/sandbox-payment`,{},customer.cookie,'POST',201,headers);
 const duplicate=await call(`/workspace/bookings/${booking.id}/sandbox-payment`,{},customer.cookie,'POST',201,headers);assert.equal(payment.data.id,duplicate.data.id);checks++;
 await call(`/workspace/bookings/${booking.id}/action`,{status:'IN_PROGRESS'},provider.cookie,'POST',201);
 await call(`/workspace/bookings/${booking.id}/action`,{status:'DELIVERED'},provider.cookie,'POST',400);
 await call(`/workspace/bookings/${booking.id}/deliverables`,{filename:'Final project',url:'https://example.com/test-delivery'},provider.cookie,'POST',201);
 await call(`/workspace/bookings/${booking.id}/action`,{status:'DELIVERED'},provider.cookie,'POST',201);
 await call(`/workspace/bookings/${booking.id}/action`,{status:'COMPLETED'},provider.cookie,'POST',403);
 await call(`/workspace/bookings/${booking.id}/action`,{status:'COMPLETED'},customer.cookie,'POST',201);
 await call(`/workspace/bookings/${booking.id}/review`,{rating:5,text:'Integration test review, not a real customer testimonial'},customer.cookie,'POST',201);
 await call(`/workspace/bookings/${booking.id}/review`,{rating:5,text:'Duplicate'},customer.cookie,'POST',400);
 const agency=(await call('/workspace/agencies',{slug:`agency-${suffix}`,name:'Integration Agency',bio:'Test-only creative agency'},provider.cookie,'POST',201)).data;
 await call(`/workspace/agencies/${agency.id}`,undefined,stranger.cookie,'GET',403);
 await call(`/workspace/agencies/${agency.id}/members`,{userId:customer.data.user.id,role:'AGENCY_MEMBER'},provider.cookie,'POST',201);
 await call(`/workspace/agencies/${agency.id}`,undefined,customer.cookie);
 await call(`/workspace/agencies/${agency.id}/services`,{creatorId:c.id,categoryId:categories[0].id,title:'Agency edit',description:'Agency test package',isRemote:true,published:true,priceMinor:'1000000',revisions:1,durationDays:7},provider.cookie,'POST',201);
 await call(`/agencies/${agency.slug}`);
 await call(`/creators?budget=15000&remote=true&rating=4`);
 const firstView=await call(`/creators/${c.id}/view`,{},'', 'POST',201);await call(`/creators/${c.id}/view`,{},firstView.cookie,'POST',201);
 await call('/auth/forgot-password',{email:customer.data.user.email},'', 'POST',201);
 await call('/auth/verify-email',{token:'invalid-verification-token-123456'},'', 'POST',400);
 const start=new Date(Date.now()+5*86400000),end=new Date(start.getTime()+3600000);
 const conflict1=(await call('/workspace/bookings',{creatorId:c.id,title:'Reserved date',details:'A date-specific test booking.',startsAt:start.toISOString(),endsAt:end.toISOString()},customer.cookie,'POST',201)).data;
 const conflict2=(await call('/workspace/bookings',{creatorId:c.id,title:'Conflicting date',details:'A conflicting test booking.',startsAt:start.toISOString(),endsAt:end.toISOString()},stranger.cookie,'POST',201)).data;
 for(const item of [{booking:conflict1,cookie:customer.cookie},{booking:conflict2,cookie:stranger.cookie}]){await call(`/workspace/bookings/${item.booking.id}/quote`,{amountMinor:'1000000',description:'Test appointment',expiresAt:new Date(Date.now()+86400000).toISOString()},provider.cookie,'POST',201);await call(`/workspace/bookings/${item.booking.id}/action`,{status:'AWAITING_PAYMENT'},item.cookie,'POST',201);}
 const refundPayment=await call(`/workspace/bookings/${conflict1.id}/sandbox-payment`,{},customer.cookie,'POST',201,{'Idempotency-Key':`conflict_${conflict1.id}`});
 await call(`/workspace/bookings/${conflict2.id}/sandbox-payment`,{},stranger.cookie,'POST',409,{'Idempotency-Key':`conflict_${conflict2.id}`});
 await call(`/workspace/bookings/${conflict1.id}/action`,{status:'CANCELLED'},customer.cookie,'POST',201);
 await call('/admin',undefined,customer.cookie,'GET',403);
 await call('/workspace/export',undefined,customer.cookie);
 if(process.env.TEST_SKIP_DB!=='true'){
 assert.equal(await db.paymentTransaction.count({where:{bookingId:booking.id}}),1);checks++;
 const journal=await db.ledgerTransaction.findUnique({where:{externalKey:`sandbox:${payment.data.id}`},include:{entries:true}});assert.equal(journal.entries.reduce((n,e)=>n+e.debitMinor-e.creditMinor,0n),0n);checks++;
 await assert.rejects(db.ledgerEntry.update({where:{id:journal.entries[0].id},data:{debitMinor:0n}}));checks++;
 }
 if(process.env.TEST_RESULT_PATH){const {writeFileSync}=await import('node:fs');writeFileSync(process.env.TEST_RESULT_PATH,JSON.stringify({bookingId:booking.id,paymentId:payment.data.id,refundPaymentId:refundPayment.data.id,customerId:customer.data.user.id,customerCookie:customer.cookie,creatorId:c.id}));}
 console.log(`PASS: ${checks} API/database checks — customer/creator journey, private access, idempotency, immutable balanced ledger, review eligibility.`);
}finally{await db.$disconnect();}
