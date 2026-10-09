/** Adapters fail closed until verified provider contracts and signed webhook specs are implemented. */
export interface CheckoutInput { bookingId:string;amountMinor:bigint;currency:string;idempotencyKey:string;merchantReference:string; }
export interface VerifiedPaymentEvent { eventId:string;reference:string;status:'SUCCEEDED'|'FAILED';amountMinor:bigint;currency:string; }
export interface PaymentAdapter { readonly name:string;createHostedCheckout(input:CheckoutInput):Promise<{url:string;reference:string}>;verifyWebhook(rawBody:Buffer,headers:Record<string,string>):Promise<VerifiedPaymentEvent>; }
export class UnconfiguredPaymentAdapter implements PaymentAdapter {
 constructor(public readonly name:'PayHere'|'OnePay'|'WEBXPAY'){}
 async createHostedCheckout(_input:CheckoutInput):Promise<{url:string;reference:string}>{throw new Error(`${this.name} live checkout disabled: provider contract, credentials and integration verification required`);}
 async verifyWebhook(_rawBody:Buffer,_headers:Record<string,string>):Promise<VerifiedPaymentEvent>{throw new Error(`${this.name} webhook disabled: provider-specific signature verification not implemented`);}
}
export const liveAdapters={payhere:new UnconfiguredPaymentAdapter('PayHere'),onepay:new UnconfiguredPaymentAdapter('OnePay'),webxpay:new UnconfiguredPaymentAdapter('WEBXPAY')};
