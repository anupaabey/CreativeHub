import { canTransitionBooking } from './index';
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
test('request can proceed to quotation',()=>assert.equal(canTransitionBooking('REQUESTED','QUOTED'),true));
test('cannot complete booking before confirmation',()=>assert.equal(canTransitionBooking('REQUESTED','COMPLETED'),false));
test('completed booking can be disputed',()=>assert.equal(canTransitionBooking('COMPLETED','DISPUTED'),true));
