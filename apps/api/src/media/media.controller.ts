import {Response} from 'express';
import {Controller,Post,Get,Body,Param,Req,Res,UseGuards,BadRequestException,ForbiddenException,NotFoundException} from '@nestjs/common';
import {IsString,IsIn,IsInt,Min,Max,MaxLength,IsOptional,IsBoolean} from 'class-validator';
import {S3Client,PutObjectCommand,GetObjectCommand,HeadObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {randomUUID} from 'crypto';
import {SessionGuard,AuthRequest} from '../common/session.guard';
import {WorkspaceService} from '../workspace/workspace.service';
class UploadDto {
 @IsString() @MaxLength(150) filename!:string;
 @IsIn(['image/jpeg','image/png','image/webp','video/mp4','application/pdf']) contentType!:string;
 @IsInt() @Min(1) @Max(52428800) sizeBytes!:number;
 @IsBoolean() public!:boolean;
 @IsOptional() @IsString() bookingId?:string;
}
@Controller('media') export class MediaController {
 constructor(private workspace:WorkspaceService){}
 private s3(publicEndpoint=false){if(!process.env.S3_ACCESS_KEY_ID||!process.env.S3_SECRET_ACCESS_KEY||!process.env.S3_BUCKET)throw new BadRequestException('Object storage is not configured');return new S3Client({region:process.env.S3_REGION??'us-east-1',endpoint:publicEndpoint?(process.env.S3_PUBLIC_ENDPOINT??process.env.S3_ENDPOINT):process.env.S3_ENDPOINT,forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}});}
 @UseGuards(SessionGuard) @Post('upload') async upload(@Req() r:AuthRequest,@Body() d:UploadDto){
  if(d.public&&!d.contentType.startsWith('image/'))throw new BadRequestException('Only raster images can be public');
  if(d.bookingId){const b=await this.workspace.booking(d.bookingId,r.authUser!.id);if(b.creator?.userId!==r.authUser!.id)throw new ForbiddenException('Only project provider can upload deliverables');if(d.public)throw new BadRequestException('Deliverables must be private');}
  const key=`${r.authUser!.id}/${randomUUID()}`;const client=this.s3(true);const url=await getSignedUrl(client,new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,ContentType:d.contentType,ContentLength:d.sizeBytes}),{expiresIn:300});
  const object=await this.workspace.db.storedObject.create({data:{ownerId:r.authUser!.id,key,...d}});return {id:object.id,url,method:'PUT',headers:{'Content-Type':d.contentType},expiresIn:300};
 }
 @UseGuards(SessionGuard) @Post(':id/confirm') async confirm(@Req() r:AuthRequest,@Param('id') id:string){const object=await this.workspace.db.storedObject.findUnique({where:{id}});if(!object||object.ownerId!==r.authUser!.id)throw new ForbiddenException();if(object.confirmedAt)return {url:`${process.env.API_PUBLIC_URL??'http://localhost:4000'}/api/v1/media/${id}/public`};const head=await this.s3().send(new HeadObjectCommand({Bucket:process.env.S3_BUCKET,Key:object.key}));if(head.ContentLength!==object.sizeBytes||head.ContentType!==object.contentType)throw new BadRequestException('Uploaded object does not match allowed metadata');await this.workspace.db.storedObject.update({where:{id},data:{confirmedAt:new Date()}});if(object.bookingId){const b=await this.workspace.booking(object.bookingId,r.authUser!.id);await this.workspace.db.deliverable.create({data:{projectId:b.project!.id,storageKey:`object:${id}`,filename:object.filename,uploadedById:r.authUser!.id}});}return {url:`${process.env.API_PUBLIC_URL??'http://localhost:4000'}/api/v1/media/${id}/public`};}
 @Get(':id/public') async publicObject(@Param('id') id:string,@Res() res:Response){const object=await this.workspace.db.storedObject.findUnique({where:{id}});if(!object?.public||!object.confirmedAt)throw new NotFoundException();res.redirect(await getSignedUrl(this.s3(true),new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:object.key}),{expiresIn:300}));}
 @UseGuards(SessionGuard) @Get(':id/private') async privateObject(@Req() r:AuthRequest,@Param('id') id:string){const object=await this.workspace.db.storedObject.findUnique({where:{id}});if(!object?.confirmedAt)throw new NotFoundException();if(object.ownerId!==r.authUser!.id){if(!object.bookingId)throw new ForbiddenException();await this.workspace.booking(object.bookingId,r.authUser!.id);}return {url:await getSignedUrl(this.s3(true),new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:object.key,ResponseContentDisposition:'attachment'}),{expiresIn:120})};}
}
