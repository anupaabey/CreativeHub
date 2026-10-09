import { Injectable,NestInterceptor,ExecutionContext,CallHandler } from '@nestjs/common';
import { map } from 'rxjs/operators';
@Injectable() export class JsonInterceptor implements NestInterceptor {intercept(_context:ExecutionContext,next:CallHandler){return next.handle().pipe(map(value=>JSON.parse(JSON.stringify(value,(_key,v)=>typeof v==='bigint'?v.toString():v))));}}
