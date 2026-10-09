import { Request,Response } from 'express';
import { randomBytes,createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { Controller,Get,Param,Query,NotFoundException,Post,Body,Req,Res,UseGuards,BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString,IsOptional,MaxLength,IsBoolean } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuthRequest,SessionGuard } from '../common/session.guard';
class CreatePortfolioDto {
 @IsString() @MaxLength(120) title!:string;
 @IsString() @MaxLength(3000) description!:string;
 @IsOptional() @IsBoolean() clientConsent?:boolean;
}
@ApiTags('Marketplace') @Controller() export class MarketplaceController {
 constructor(private db:PrismaService){}
 @Post('creators/:id/view') async view(@Param('id') creatorId:string,@Req() req:Request,@Res({passthrough:true}) res:Response){const c=await this.db.creator.findFirst({where:{id:creatorId,published:true}});if(!c)throw new NotFoundException();if(/bot|crawler|spider/i.test(req.headers['user-agent']??''))return {counted:false};let visitor=req.cookies?.creativehub_visitor;if(typeof visitor!=='string'||!/^[a-zA-Z0-9_-]{20,60}$/.test(visitor)){visitor=randomBytes(24).toString('base64url');res.cookie('creativehub_visitor',visitor,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:30*86400000,path:'/'});}const visitorHash=createHash('sha256').update(`${process.env.ANALYTICS_HASH_SALT??'development'}:${visitor}:${new Date().toISOString().slice(0,10)}`).digest('hex');await this.db.analyticsEvent.upsert({where:{creatorId_eventType_visitorHash:{creatorId,eventType:'PROFILE_VIEW',visitorHash}},create:{creatorId,eventType:'PROFILE_VIEW',visitorHash},update:{}});return {counted:true};}
 @Get('agencies') agencies(){return this.db.agency.findMany({select:{slug:true,name:true,bio:true,logoUrl:true,verifiedAt:true},take:100});}
 @Get('agencies/:slug') async agency(@Param('slug') slug:string){const agency=await this.db.agency.findUnique({where:{slug},select:{id:true,slug:true,name:true,bio:true,logoUrl:true,verifiedAt:true,members:{select:{user:{select:{name:true,creator:{select:{id:true,username:true,published:true,headline:true}}}}}},services:{where:{published:true},include:{packages:true,creator:{select:{id:true,username:true}}}}}});if(!agency)throw new NotFoundException();return agency;}
 @Get('plans') plans(){return this.db.subscriptionPlan.findMany({where:{active:true},orderBy:{priceMinor:'asc'}});}
 @Get('categories') categories(){return this.db.category.findMany({where:{parentId:null,active:true},include:{children:{where:{active:true}}},orderBy:{name:'asc'}});}
 @Get('districts') districts(){return this.db.district.findMany({where:{country:{code:'LK'}},orderBy:{name:'asc'}});}
 @Get('creators') async creators(@Query('q') q?:string,@Query('district') district?:string,@Query('category') category?:string,@Query('page') page?:string,@Query('city') city?:string,@Query('budget') budget?:string,@Query('remote') remote?:string,@Query('rating') rating?:string,@Query('sort') sort?:string){
  const number=Math.max(1,Math.min(10000,Number(page)||1));const take=12;
  let ratedIds:string[]|undefined;
  if(rating){const value=Number(rating);if(!Number.isFinite(value)||value<1||value>5)throw new BadRequestException('Rating must be 1–5');ratedIds=(await this.db.review.groupBy({by:['creatorId'],_avg:{rating:true},having:{rating:{_avg:{gte:value}}}})).map(x=>x.creatorId);}
  if(budget&&!/^\d{1,9}(\.\d{1,2})?$/.test(budget))throw new BadRequestException('Invalid LKR budget');
  const where:Prisma.CreatorWhereInput={published:true,...(ratedIds?{id:{in:ratedIds}}:{}),...(city?{city:{contains:city,mode:'insensitive'}}:{}),...(district?{district:{name:{equals:district,mode:'insensitive' as const}}}:{}),...(q?{OR:[{headline:{contains:q,mode:'insensitive' as const}},{user:{name:{contains:q,mode:'insensitive' as const}}}]}:{}),...((category||budget||remote)?{services:{some:{published:true,...(category?{category:{OR:[{slug:category},{parent:{slug:category}}]}}:{}),...(remote?{isRemote:remote==='true'}:{}),...(budget?{packages:{some:{priceMinor:{lte:BigInt(Math.round(Number(budget)*100))}}}}:{})}}}:{})};
  const [items,total]=await this.db.$transaction([this.db.creator.findMany({where,skip:(number-1)*take,take,include:{user:{select:{name:true,avatarUrl:true}},district:{select:{name:true}},portfolio:{where:{visibility:'PUBLIC',clientConsent:true},take:1,select:{coverUrl:true}},services:{where:{published:true},select:{packages:{select:{priceMinor:true}}}},reviews:{select:{rating:true}}},orderBy:sort==='name'?{user:{name:'asc'}}:{createdAt:'desc'}}),this.db.creator.count({where})]);
  return {items:items.map(c=>({...c,rating:c.reviews.length?c.reviews.reduce((n,r)=>n+r.rating,0)/c.reviews.length:null,reviewCount:c.reviews.length})),total,page:number,pageSize:take};
 }
 @Get('creators/:username') async creator(@Param('username') username:string){
  const creator=await this.db.creator.findUnique({where:{username},include:{user:{select:{name:true,avatarUrl:true}},district:true,portfolio:{where:{visibility:'PUBLIC',clientConsent:true},include:{media:true}},services:{where:{published:true},include:{category:true,packages:true}},reviews:{include:{author:{select:{name:true}}},orderBy:{createdAt:'desc'},take:20}}});
  if(!creator?.published)throw new NotFoundException('Creator not found');
  return JSON.parse(JSON.stringify(creator,(_,value)=>typeof value==='bigint'?value.toString():value));
 }
 @UseGuards(SessionGuard) @Post('portfolio') async addPortfolio(@Req() req:AuthRequest,@Body() dto:CreatePortfolioDto){
  const creator=await this.db.creator.findUnique({where:{userId:req.authUser!.id}});
  if(!creator)throw new BadRequestException('Create a creator profile first');
  const slug=dto.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)+'-'+Date.now().toString(36);
  return this.db.portfolioProject.create({data:{creatorId:creator.id,title:dto.title,description:dto.description,clientConsent:dto.clientConsent??false,slug}});
 }
}
