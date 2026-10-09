import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
const transitions: Record<BookingStatus, readonly BookingStatus[]> = {
 REQUESTED:['QUOTED','REJECTED','CANCELLED'], QUOTED:['AWAITING_PAYMENT','CANCELLED','REJECTED','EXPIRED'], AWAITING_PAYMENT:['CONFIRMED','CANCELLED','EXPIRED'], CONFIRMED:['IN_PROGRESS','CANCELLED','DISPUTED'], IN_PROGRESS:['DELIVERED','CANCELLED','DISPUTED'], DELIVERED:['COMPLETED','REVISION_REQUESTED','DISPUTED'], REVISION_REQUESTED:['IN_PROGRESS','DISPUTED'], COMPLETED:['DISPUTED'], DISPUTED:['COMPLETED','CANCELLED'], CANCELLED:[], REJECTED:[], EXPIRED:[]
};
export function assertTransition(from:BookingStatus,to:BookingStatus,side:'customer'|'provider'|'system'|'admin') {
 if(!transitions[from].includes(to)) throw new BadRequestException(`Cannot move ${from} to ${to}`);
 const allowed:Record<string,readonly string[]>={customer:['AWAITING_PAYMENT','CANCELLED','COMPLETED','REVISION_REQUESTED','DISPUTED'],provider:['QUOTED','REJECTED','IN_PROGRESS','DELIVERED','CANCELLED','DISPUTED'],system:['CONFIRMED','EXPIRED'],admin:['COMPLETED','CANCELLED']};
 if(!allowed[side].includes(to))throw new ForbiddenException('This action belongs to the other booking participant');
}
export function money(value:string):bigint {if(!/^[1-9]\d{0,11}$/.test(value))throw new BadRequestException('Amount must be positive integer minor units');return BigInt(value);}
export function commission(amount:bigint,bps:number):bigint {if(!Number.isInteger(bps)||bps<0||bps>10000)throw new BadRequestException('Invalid commission');return (amount*BigInt(bps)+5000n)/10000n;}
export function balanced(entries:{debitMinor:bigint;creditMinor:bigint}[]) {return entries.length>=2&&entries.every(e=>e.debitMinor>=0n&&e.creditMinor>=0n&&!(e.debitMinor&&e.creditMinor))&&entries.reduce((sum,e)=>sum+e.debitMinor-e.creditMinor,0n)===0n;}
