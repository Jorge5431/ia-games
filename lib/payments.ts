import 'server-only';

import { flags } from './rules';

export type PendingOrder = {
  id:string;
  gameId:string;
  buyerId:string;
  amountInCents:number;
  currency:'BRL';
};

export interface PaymentProvider {
  createSession(order:PendingOrder, idempotencyKey:string):Promise<{checkoutUrl:URL;externalSessionId:string}>;
  verifyWebhook(rawBody:Uint8Array,headers:Headers):Promise<{
    eventId:string;
    orderId:string;
    amountInCents:number;
    currency:'BRL';
    status:'paid'|'failed'|'refunded';
  }>;
}

export function paymentAvailability(provider?:PaymentProvider) {
  if(!flags.realPayments || !provider) return {state:'unavailable'} as const;
  return {state:'available',provider} as const;
}
