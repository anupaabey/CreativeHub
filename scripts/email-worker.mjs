// Run as a single worker until a distributed queue is configured.
import {PrismaClient} from '@prisma/client';
import nodemailer from 'nodemailer';
if(!process.env.SMTP_HOST||!process.env.EMAIL_FROM)throw new Error('SMTP_HOST and EMAIL_FROM required');
const db=new PrismaClient();
const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT??587),secure:process.env.SMTP_SECURE==='true',...(process.env.SMTP_USER?{auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}}:{})});
let stopped=false;process.on('SIGTERM',()=>{stopped=true;});
while(!stopped){const jobs=await db.emailJob.findMany({where:{status:'PENDING',attempts:{lt:5}},orderBy:{createdAt:'asc'},take:20});for(const job of jobs){try{await transport.sendMail({from:process.env.EMAIL_FROM,to:job.recipient,subject:job.subject,text:job.body});await db.emailJob.update({where:{id:job.id},data:{status:'SENT',sentAt:new Date(),attempts:{increment:1}}});}catch(e){await db.emailJob.update({where:{id:job.id},data:{attempts:{increment:1},lastError:String(e).slice(0,500)}});}}await new Promise(resolve=>setTimeout(resolve,5000));}
await db.$disconnect();
