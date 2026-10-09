import {IsEmail,IsString,MinLength,MaxLength,Matches} from 'class-validator';
export class RegisterDto {
 @IsEmail() email!:string;
 @IsString() @MinLength(12) @MaxLength(128) password!:string;
 @IsString() @MinLength(2) @MaxLength(120) name!:string;
}
export class LoginDto {
 @IsEmail() email!:string;
 @IsString() password!:string;
}
export class CreatorSetupDto {
 @IsString() @Matches(/^[a-z0-9][a-z0-9_-]{2,29}$/) username!:string;
 @IsString() @MaxLength(140) headline!:string;
}
