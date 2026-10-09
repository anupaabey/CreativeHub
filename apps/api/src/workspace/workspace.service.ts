import { Injectable, BadRequestException, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestDto, QuoteDto } from './dto';
import { assertTransition, money, commission, balanced } from './domain';
const bookingInclude={creator:{include:{user:{select:{name:true}}}},customer:{select:{name:true}},request:true,quotation:true,package:true,project:{include:{deliverables:true}},conversation:true,review:true,paymentTransactions:true,history:true} satisfies Prisma.BookingInclude;
@Injectable() export class WorkspaceService {
 constructor(public db:PrismaService){}
 async creator(userId:string){const c=await this.db.creator.findUnique({where:{userId}});if(!c)throw new ForbiddenException('Create a creator profile first');return c;}
 async booking(id:string,userId:string,tx:Prisma.TransactionClient=this.db){
  const b=await tx.booking.findUnique({where:{id},include:bookingInclude});if(!b)throw new NotFoundException('Booking not found');
  if(b.customerId!==userId&&b.creator?.userId!==userId){const admin=b.agencyId?await tx.agencyMember.findFirst({where:{agencyId:b.agencyId,userId,role:'AGENCY_ADMIN'}}):null;if(!admin)throw new ForbiddenException('Private booking');}return b;
 }
 async serial<T>(fn:(tx:Prisma.TransactionClient)=>Promise<T>):Promise<T>{
  for(let attempt=0;attempt<3;attempt++){try{return await this.db.$transaction(fn,{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});}catch(e){if((e as {code?:string}).code==='P2034'){if(attempt<2)continue;throw new ConflictException('Booking changed; refresh and retry');}throw e;}}throw new ConflictException();
 }
 async request(userId:string,d:RequestDto){
  const c=await this.db.creator.findUnique({where:{id:d.creatorId}});if(!c?.published)throw new NotFoundException('Provider unavailable');if(c.userId===userId)throw new BadRequestException('Cannot book yourself');
  if(Boolean(d.startsAt)!==Boolean(d.endsAt)||d.startsAt&&(new Date(d.startsAt)<=new Date()||new Date(d.endsAt!)<=new Date(d.startsAt)))throw new BadRequestException('Choose a future start and a later end');
  let agencyId=d.agencyId;
  if(d.packageId){const p=await this.db.servicePackage.findUnique({where:{id:d.packageId},include:{service:true}});if(!p||p.service.creatorId!==c.id||!p.service.published)throw new BadRequestException('Invalid package');agencyId=p.service.agencyId??agencyId;}
  if(agencyId&&!await this.db.agencyMember.findFirst({where:{agencyId,userId:c.userId}}))throw new BadRequestException('Creator is not in this agency');
  return this.serial(async tx=>{
   const request=await tx.customerRequest.create({data:{customerId:userId,title:d.title,details:d.details,desiredStart:d.startsAt?new Date(d.startsAt):null,desiredEnd:d.endsAt?new Date(d.endsAt):null}});
   const b=await tx.booking.create({data:{customerId:userId,creatorId:c.id,agencyId,requestId:request.id,packageId:d.packageId,startsAt:request.desiredStart,endsAt:request.desiredEnd,conversation:{create:{participants:{create:[{userId},{userId:c.userId}]}}},project:{create:{}}}});
   await this.notify(tx,c.userId,'BOOKING','New booking request',d.title);return b;
  });
 }
 async quote(id:string,userId:string,d:QuoteDto){return this.serial(async tx=>{
  const b=await this.booking(id,userId,tx);if(b.customerId===userId)throw new ForbiddenException();
  if(b.status!=='QUOTED')assertTransition(b.status,'QUOTED','provider');if(b.quotationId)await tx.quotation.update({where:{id:b.quotationId},data:{status:'SUPERSEDED'}});if(new Date(d.expiresAt)<=new Date())throw new BadRequestException('Quote expiry must be in the future');
  const quote=await tx.quotation.create({data:{requestId:b.requestId!,providerId:b.creatorId!,amountMinor:money(d.amountMinor),description:d.description,expiresAt:new Date(d.expiresAt)}});
  await tx.bookingHistory.create({data:{bookingId:id,previous:b.status,next:'QUOTED',actorId:userId}});
  await this.notify(tx,b.customerId,'QUOTE','Quotation received',d.description);
  return tx.booking.update({where:{id},data:{status:'QUOTED',quotationId:quote.id,agreedAmountMinor:quote.amountMinor}});
 });}
 async transition(id:string,userId:string,next:BookingStatus,reason?:string){return this.serial(async tx=>{
  const b=await this.booking(id,userId,tx);const side=b.customerId===userId?'customer':'provider';assertTransition(b.status,next,side);
  if(next==='AWAITING_PAYMENT'&&(!b.quotation||b.quotation.expiresAt<=new Date()))throw new BadRequestException('Quotation expired');
  if(next==='DELIVERED'&&!b.project?.deliverables.length)throw new BadRequestException('Add deliverables first');
  if(next==='REVISION_REQUESTED'){const used=b.history.filter(h=>h.next==='REVISION_REQUESTED').length;if(used>=(b.package?.revisions??1))throw new BadRequestException('Included revisions exhausted');}
  if(next==='DISPUTED'){if(!reason?.trim())throw new BadRequestException('Describe the dispute');await tx.dispute.create({data:{bookingId:id,openedById:userId,reason}});}
  await tx.bookingHistory.create({data:{bookingId:id,previous:b.status,next,actorId:userId}});
  if(next==='AWAITING_PAYMENT')await tx.quotation.update({where:{id:b.quotationId!},data:{status:'ACCEPTED'}});
  await this.notify(tx,side==='customer'?b.creator!.userId:b.customerId,'BOOKING',`Booking ${next.toLowerCase().replace(/_/g,' ')}`,b.request?.title??id);
  return tx.booking.update({where:{id},data:{status:next}});
 });}
 async notify(tx:Prisma.TransactionClient,userId:string,type:string,title:string,body:string){await tx.notification.create({data:{userId,type,title,body}});}
 async sandboxPay(id:string,userId:string,key:string){
  if(process.env.PAYMENTS_MODE!=='sandbox')throw new BadRequestException('Sandbox checkout is disabled. Live gateway activation requires an approved integration.');
  if(!/^[a-zA-Z0-9_-]{8,100}$/.test(key))throw new BadRequestException('Valid Idempotency-Key required');
  return this.serial(async tx=>{
   const b=await this.booking(id,userId,tx);if(b.customerId!==userId)throw new ForbiddenException();
   const prior=await tx.paymentTransaction.findUnique({where:{idempotencyKey:key}});if(prior){if(prior.bookingId!==id||prior.provider!=='SANDBOX')throw new ConflictException('Idempotency key already used');return prior;}
   if(b.status!=='AWAITING_PAYMENT'||!b.agreedAmountMinor)throw new BadRequestException('Accept a quotation first');
   if(!b.quotation||b.quotation.expiresAt<=new Date())throw new BadRequestException('Quotation expired');
   if(b.startsAt&&b.endsAt){const overlap=await tx.booking.findFirst({where:{id:{not:id},creatorId:b.creatorId,status:{in:['CONFIRMED','IN_PROGRESS','DELIVERED','REVISION_REQUESTED']},startsAt:{lt:b.endsAt},endsAt:{gt:b.startsAt}}});const blocked=await tx.availabilitySlot.findFirst({where:{creatorId:b.creatorId!,isBlocked:true,startsAt:{lt:b.endsAt},endsAt:{gt:b.startsAt}}});if(overlap||blocked)throw new ConflictException('Provider is unavailable for these dates');}
   const sub=await tx.subscription.findFirst({where:{userId:b.creator!.userId,status:'ACTIVE',OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},include:{plan:true},orderBy:{startedAt:'desc'}});
   const free=await tx.subscriptionPlan.findUnique({where:{code:'FREE'}});const fee=commission(b.agreedAmountMinor,sub?.plan.monthlyCommissionBps??free?.monthlyCommissionBps??1000);
   const debit=await tx.ledgerAccount.upsert({where:{code:'SANDBOX_PARTNER_RECEIVABLE'},update:{},create:{code:'SANDBOX_PARTNER_RECEIVABLE',name:'Test partner receivable'}});
   const creator=await tx.ledgerAccount.upsert({where:{code:`SANDBOX_CREATOR_${b.creatorId}`},update:{},create:{code:`SANDBOX_CREATOR_${b.creatorId}`,name:'Test creator entitlement'}});
   const platform=await tx.ledgerAccount.upsert({where:{code:'SANDBOX_COMMISSION'},update:{},create:{code:'SANDBOX_COMMISSION',name:'Test commission'}});
   const entries=[{accountId:debit.id,debitMinor:b.agreedAmountMinor,creditMinor:0n},{accountId:creator.id,debitMinor:0n,creditMinor:b.agreedAmountMinor-fee},{accountId:platform.id,debitMinor:0n,creditMinor:fee}];if(!balanced(entries))throw new BadRequestException('Unbalanced ledger');
   const payment=await tx.paymentTransaction.create({data:{bookingId:id,provider:'SANDBOX',providerReference:`test_${key}`,idempotencyKey:key,mode:'PARTNER_MARKETPLACE',status:'SUCCEEDED',amountMinor:b.agreedAmountMinor}});
   await tx.ledgerTransaction.create({data:{externalKey:`sandbox:${payment.id}`,description:'SANDBOX ONLY — no money moved',entries:{create:entries}}});
   await tx.bookingHistory.create({data:{bookingId:id,previous:b.status,next:'CONFIRMED',actorId:userId}});await tx.booking.update({where:{id},data:{status:'CONFIRMED'}});
   await this.notify(tx,b.creator!.userId,'PAYMENT','Sandbox booking confirmed','Test payment only. No funds collected.');return payment;
  });
 }
}
