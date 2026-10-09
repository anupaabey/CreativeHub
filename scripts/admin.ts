import {PrismaClient} from '@prisma/client';
const db=new PrismaClient();const email=process.argv[2]?.toLowerCase();
if(!email)throw new Error('Usage: npm run admin:grant -- registered@email.example');
const user=await db.user.findUnique({where:{email}});if(!user||user.deletedAt)throw new Error('Register this user first');
await db.$transaction(async tx=>{await tx.userRole.upsert({where:{userId_role:{userId:user.id,role:'ADMIN'}},create:{userId:user.id,role:'ADMIN'},update:{}});await tx.auditLog.create({data:{actorId:user.id,action:'CLI_GRANT_ADMIN',entity:'User',entityId:user.id}});});
console.log('Admin role granted to the specified registered account.');await db.$disconnect();
