import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, MaxLength, MinLength, IsIn, IsDateString, IsUrl, Matches } from 'class-validator';
export class ProfileDto {
 @IsOptional() @IsString() @MaxLength(140) headline?:string;
 @IsOptional() @IsString() @MaxLength(5000) bio?:string;
 @IsOptional() @IsString() districtId?:string;
 @IsOptional() @IsString() @MaxLength(100) city?:string;
 @IsOptional() @IsUrl({protocols:['http','https'],require_protocol:true,require_tld:false}) coverUrl?:string;
 @IsOptional() @IsBoolean() published?:boolean;
}
export class PortfolioDto {
 @IsString() @MinLength(1) @MaxLength(120) title!:string;
 @IsString() @MaxLength(5000) description!:string;
 @IsOptional() @IsUrl({protocols:['http','https'],require_protocol:true,require_tld:false}) coverUrl?:string;
 @IsBoolean() clientConsent!:boolean;
 @IsIn(['DRAFT','PUBLIC','ARCHIVED']) visibility!:'DRAFT'|'PUBLIC'|'ARCHIVED';
}
export class ServiceDto {
 @IsString() categoryId!:string;
 @IsString() @MinLength(1) @MaxLength(150) title!:string;
 @IsString() @MaxLength(5000) description!:string;
 @IsBoolean() isRemote!:boolean;
 @IsBoolean() published!:boolean;
 @IsString() @Matches(/^[1-9]\d{0,11}$/) priceMinor!:string;
 @IsInt() @Min(0) @Max(20) revisions!:number;
 @IsInt() @Min(1) @Max(365) durationDays!:number;
}
export class RequestDto {
 @IsOptional() @IsString() agencyId?:string;
 @IsString() creatorId!:string;
 @IsOptional() @IsString() packageId?:string;
 @IsString() @MinLength(3) @MaxLength(150) title!:string;
 @IsString() @MinLength(10) @MaxLength(10000) details!:string;
 @IsOptional() @IsDateString() startsAt?:string;
 @IsOptional() @IsDateString() endsAt?:string;
}
export class QuoteDto {
 @IsString() @Matches(/^[1-9]\d{0,11}$/) amountMinor!:string;
 @IsString() @MinLength(1) @MaxLength(5000) description!:string;
 @IsDateString() expiresAt!:string;
}
export class ActionDto {@IsIn(['AWAITING_PAYMENT','IN_PROGRESS','DELIVERED','COMPLETED','REVISION_REQUESTED','CANCELLED','REJECTED','DISPUTED']) status!: 'AWAITING_PAYMENT'|'IN_PROGRESS'|'DELIVERED'|'COMPLETED'|'REVISION_REQUESTED'|'CANCELLED'|'REJECTED'|'DISPUTED'; @IsOptional() @IsString() @MaxLength(3000) reason?:string;}
export class MessageDto {@IsString() @MinLength(1) @MaxLength(5000) text!:string;}
export class ReviewDto {@IsInt() @Min(1) @Max(5) rating!:number; @IsString() @MaxLength(3000) text!:string;}
export class DeliverableDto {@IsString() @MaxLength(255) filename!:string; @IsUrl({protocols:['https'],require_protocol:true}) url!:string;}
export class AgencyDto {@IsString() @Matches(/^[a-z0-9][a-z0-9-]{2,49}$/) slug!:string; @IsString() @MinLength(2) @MaxLength(150) name!:string; @IsString() @MaxLength(5000) bio!:string;}
export class MemberDto {@IsString() userId!:string; @IsIn(['AGENCY_ADMIN','AGENCY_MEMBER']) role!:'AGENCY_ADMIN'|'AGENCY_MEMBER';}
export class CategoryDto {@IsString() @MaxLength(100) name!:string; @IsString() @Matches(/^[a-z0-9-]{2,100}$/) slug!:string; @IsOptional() @IsString() parentId?:string; @IsBoolean() active!:boolean;}
export class PlanDto {@IsString() @MaxLength(100) name!:string; @IsString() @Matches(/^\d{1,12}$/) priceMinor!:string; @IsInt() @Min(0) @Max(10000) monthlyCommissionBps!:number; @IsBoolean() active!:boolean;}
export class SupportDto {@IsString() @MinLength(3) @MaxLength(150) title!:string; @IsString() @MinLength(10) @MaxLength(5000) message!:string;}

export class AgencyServiceDto extends ServiceDto {@IsString() creatorId!:string;}
export class AssignmentDto {@IsString() creatorId!:string;}
export class RefundDto {@IsString() @MinLength(10) @MaxLength(3000) reason!:string;}
