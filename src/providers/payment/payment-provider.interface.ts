export type CreateTransactionParams = {
  orderNumber: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  eventTitle: string;
  quantity: number;
  ticketPrice: number;
  adminFee: number;
  expiryDurationMinutes: number;
  paymentMethod: string;
};

export type TransactionResponse = {
  providerToken: string;
  checkoutUrl: string;
};

export type WebhookParsedData = {
  orderNumber: string;
  status: 'PAID' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  rawPayload: any;
};

export interface PaymentProvider {
  /**
   * Create a new payment transaction with the provider.
   */
  createTransaction(params: CreateTransactionParams): Promise<TransactionResponse>;

  /**
   * Verify if the incoming webhook payload is authentic.
   */
  verifyWebhookSignature(payload: any, signatureStr?: string): boolean;

  /**
   * Parse the provider-specific webhook payload into a generic format.
   */
  parseWebhookPayload(payload: any): WebhookParsedData;
}
