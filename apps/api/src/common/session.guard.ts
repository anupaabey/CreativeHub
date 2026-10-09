import { CanActivate,ExecutionContext,Injectable,UnauthorizedException,ForbiddenException,SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Request } from 'express';
export const Roles=(...roles:string[])=>SetMetadata('roles',roles);
export interface AuthRequest extends Request { authUser?:{id:string;roles:string[]}; }
@Injectable() export class SessionGuard implements CanActivate {
 constructor(private prisma:PrismaService,private reflector:Reflector){}
 async canActivate(context:ExecutionContext){
  const request=context.switchToHttp().getRequest<AuthRequest>();
  const token=request.cookies?.[process.env.SESSION_COOKIE_NAME??'creativehub_session'];
  if(typeof token!=='string')throw new UnauthorizedException('Please sign in');
  const tokenHash=createHash('sha256').update(token).digest('hex');
  const session=await this.prisma.session.findUnique({where:{tokenHash},include:{user:{include:{roles:true}}}});
  if(!session||session.revokedAt||session.expiresAt<=new Date()||session.user.deletedAt)throw new UnauthorizedException('Session expired');
  const roles=session.user.roles.map(x=>x.role);
  const required=this.reflector.getAllAndOverride<string[]>('roles',[context.getHandler(),context.getClass()]);
  if(required?.length&&!required.some(role=>roles.includes(role as typeof roles[number])))throw new ForbiddenException();
  request.authUser={id:session.userId,roles};return true;
 }
}
