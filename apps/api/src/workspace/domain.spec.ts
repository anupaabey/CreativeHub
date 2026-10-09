import {describe,it,expect} from '@jest/globals';
import {assertTransition,commission,balanced,money} from './domain';
import { ForbiddenException,BadRequestException } from '@nestjs/common';
describe('Booking authorization and finance',()=>{
 it('allows only a customer to accept a quote',()=>{expect(()=>assertTransition('QUOTED','AWAITING_PAYMENT','customer')).not.toThrow();expect(()=>assertTransition('QUOTED','AWAITING_PAYMENT','provider')).toThrow(ForbiddenException);});
 it('prevents payment bypass and provider completion approval',()=>{expect(()=>assertTransition('QUOTED','CONFIRMED','customer')).toThrow(BadRequestException);expect(()=>assertTransition('DELIVERED','COMPLETED','provider')).toThrow(ForbiddenException);});
 it('rejects changes to cancelled bookings',()=>{expect(()=>assertTransition('CANCELLED','CONFIRMED','system')).toThrow();});
 it('calculates commissions in integer minor units with deterministic rounding',()=>{expect(commission(1000000n,1000)).toBe(100000n);expect(commission(101n,700)).toBe(7n);expect(()=>commission(1n,10001)).toThrow();});
 it('requires a balanced journal with nonnegative exclusive debit or credit',()=>{expect(balanced([{debitMinor:100n,creditMinor:0n},{debitMinor:0n,creditMinor:90n},{debitMinor:0n,creditMinor:10n}])).toBe(true);expect(balanced([{debitMinor:100n,creditMinor:0n},{debitMinor:0n,creditMinor:99n}])).toBe(false);expect(balanced([{debitMinor:1n,creditMinor:1n},{debitMinor:0n,creditMinor:0n}])).toBe(false);});
 it.each(['0','-1','1.2','1000000000000','not-money'])('rejects invalid amount %s',value=>{expect(()=>money(value)).toThrow();});
});
