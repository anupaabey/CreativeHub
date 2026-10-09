import { Body,Controller,Get,Post,Req,Res,UseGuards,BadRequestException,UnauthorizedException,ConflictException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response,Request } from 'express';
import { randomBytes,createHash } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { SessionGuard,AuthRequest } from '../common/session.guard';
import { RegisterDto,LoginDto,CreatorSetupDto } from './auth.dto';
const cookieName=()=>process.env.SESSION_COOKIE_NAME??'creativehub_session';
const ttl=()=>Math.max(1,Number(process.env.SESSION_TTL_DAYS??14));
@ApiTags('Authentication') @Controller('auth') export class AuthController {
 constructor(private db:PrismaService){}
 private async createSession(userId:string,res:Response){
  const token=randomBytes(32).toString('base64url');
  await this.db.session.create({data:{userId,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+ttl()*86400000)}});
  res.cookie(cookieName(),token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:ttl()*86400000,path:'/'});
 }
 @Post('register') async register(@Body() dto:RegisterDto,@Res({passthrough:true}) res:Response){
  const email=dto.email.trim().toLowerCase();
  if(await this.db.user.findUnique({where:{email}}))throw new ConflictException('Email is already registered');
  const passwordHash=await argon2.hash(dto.password,{type:argon2.argon2id});
  const user=await this.db.user.create({data:{email,passwordHash,name:dto.name.trim(),roles:{create:{role:'CUSTOMER'}}}});
  await this.createSession(user.id,res);
  return {user:{id:user.id,name:user.name,email:user.email,roles:['CUSTOMER']}};
 }
 @Post('login') async login(@Body() dto:LoginDto,@Res({passthrough:true}) res:Response){
  const user=await this.db.user.findUnique({where:{email:dto.email.trim().toLowerCase()},include:{roles:true}});
  if(!user?.passwordHash||user.deletedAt||!(await argon2.verify(user.passwordHash,dto.password)))throw new UnauthorizedException('Invalid email or password');
  await this.createSession(user.id,res);
  return {user:{id:user.id,name:user.name,email:user.email,roles:user.roles.map(x=>x.role)}};
 }
 @UseGuards(SessionGuard) @Get('me') async me(@Req() req:AuthRequest){
  return this.db.user.findUnique({where:{id:req.authUser!.id},select:{id:true,name:true,email:true,avatarUrl:true,roles:{select:{role:true}},creator:{select:{username:true}}}});
 }
 @UseGuards(SessionGuard) @Post('become-creator') async becomeCreator(@Req() req:AuthRequest,@Body() dto:CreatorSetupDto){
  const userId=req.authUser!.id;
  if(await this.db.creator.findUnique({where:{userId}}))throw new BadRequestException('Creator already exists');
  try{return await this.db.$transaction(async tx=>{
   await tx.userRole.upsert({where:{userId_role:{userId,role:'CREATOR'}},create:{userId,role:'CREATOR'},update:{}});
   return tx.creator.create({data:{userId,username:dto.username,headline:dto.headline}});
  });}catch(error){if((error as {code?:string}).code==='P2002')throw new ConflictException('Username is taken');throw error;}
 }
 @UseGuards(SessionGuard) @Post('logout') async logout(@Req() req:AuthRequest,@Res({passthrough:true}) res:Response){
  const token=(req as Request).cookies?.[cookieName()];
  if(token)await this.db.session.updateMany({where:{tokenHash:createHash('sha256').update(token).digest('hex')},data:{revokedAt:new Date()}});
  res.clearCookie(cookieName(),{path:'/'});return {ok:true};
 }
}
