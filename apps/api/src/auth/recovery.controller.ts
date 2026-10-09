import { Body,Controller,Post,Req,UseGuards,BadRequestException } from '@nestjs/common';
import {IsEmail,IsString,MinLength,MaxLength} from 'class-validator';
import {randomBytes,createHash} from 'crypto';
import * as argon2 from 'argon2';
import {PrismaService} from '../prisma/prisma.service';
import {SessionGuard,AuthRequest} from '../common/session.guard';
class EmailDto {@IsEmail() email!:string;}
class TokenDto {@IsString() @MinLength(20) @MaxLength(100) token!:string;}
class ResetDto extends TokenDto {@IsString() @MinLength(12) @MaxLength(128) password!:string;}
@Controller('auth') export class RecoveryController {
 constructor(private db:PrismaService){}
 private hash(token:string){return createHash('sha256').update(token).digest('hex');}
 private async issue(userId:string,email:string,purpose:string){
  const token=randomBytes(32).toString('base64url');const route=purpose==='RESET'?'reset-password':'verify-email';
  await this.db.$transaction(async tx=>{await tx.authToken.updateMany({where:{userId,purpose,usedAt:null},data:{usedAt:new Date()}});await tx.authToken.create({data:{userId,tokenHash:this.hash(token),purpose,expiresAt:new Date(Date.now()+3600000)}});await tx.emailJob.create({data:{recipient:email,subject:purpose==='RESET'?'Reset your CreativeHub password':'Verify your CreativeHub email',body:`Open ${(process.env.WEB_URL??'http://localhost:3000')}/${route}?token=${token}\nThis link expires in one hour.`}});});
 }
 @Post('forgot-password') async forgot(@Body() d:EmailDto){const u=await this.db.user.findUnique({where:{email:d.email.toLowerCase().trim()}});if(u&&!u.deletedAt)await this.issue(u.id,u.email,'RESET');return {message:'If this account exists, a reset email has been queued.'};}
 @UseGuards(SessionGuard) @Post('request-verification') async requestVerification(@Req() r:AuthRequest){const u=await this.db.user.findUniqueOrThrow({where:{id:r.authUser!.id}});if(!u.emailVerifiedAt)await this.issue(u.id,u.email,'VERIFY');return {message:'Verification email queued.'};}
 @Post('verify-email') async verify(@Body() d:TokenDto){return this.db.$transaction(async tx=>{const t=await tx.authToken.findUnique({where:{tokenHash:this.hash(d.token)}});if(!t||t.purpose!=='VERIFY'||t.usedAt||t.expiresAt<=new Date())throw new BadRequestException('Invalid or expired verification link');const claim=await tx.authToken.updateMany({where:{id:t.id,usedAt:null},data:{usedAt:new Date()}});if(!claim.count)throw new BadRequestException('Link already used');await tx.user.update({where:{id:t.userId},data:{emailVerifiedAt:new Date()}});return {message:'Email verified.'};});}
 @Post('reset-password') async reset(@Body() d:ResetDto){const hash=await argon2.hash(d.password,{type:argon2.argon2id});return this.db.$transaction(async tx=>{const t=await tx.authToken.findUnique({where:{tokenHash:this.hash(d.token)}});if(!t||t.purpose!=='RESET'||t.usedAt||t.expiresAt<=new Date())throw new BadRequestException('Invalid or expired reset link');const claim=await tx.authToken.updateMany({where:{id:t.id,usedAt:null},data:{usedAt:new Date()}});if(!claim.count)throw new BadRequestException('Link already used');await tx.user.update({where:{id:t.userId},data:{passwordHash:hash}});await tx.session.updateMany({where:{userId:t.userId},data:{revokedAt:new Date()}});return {message:'Password updated. Sign in again.'};});}
}
