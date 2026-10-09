import { JsonInterceptor } from './common/json.interceptor';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
async function bootstrap(){
 const app=await NestFactory.create(AppModule);
 app.useGlobalInterceptors(new JsonInterceptor());
 app.use((req:import('express').Request,res:import('express').Response,next:import('express').NextFunction)=>{
 if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin!== (process.env.WEB_URL??'http://localhost:3000')) {res.status(403).json({message:'Trusted Origin header required'});return;}next();
 });
 app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));app.use(cookieParser());
 app.enableCors({origin:process.env.WEB_URL??'http://localhost:3000',credentials:true});
 app.setGlobalPrefix('api/v1');
 app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));
 const config=new DocumentBuilder().setTitle('CreativeHub API').setDescription('Creative services marketplace REST API').setVersion('0.1').build();
 SwaggerModule.setup('api/docs',app,SwaggerModule.createDocument(app,config));
 await app.listen(Number(process.env.PORT??4000));
}
bootstrap();
