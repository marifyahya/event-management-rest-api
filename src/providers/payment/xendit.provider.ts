import { env } from '../../config/env.js';
import { logger } from '../../libs/logger.js';
import {
  type CreateTransactionParams,
  type TransactionResponse,
  type PaymentProvider,
  type WebhookParsedData,
} from './payment-provider.interface.js';

export class XenditProvider implements PaymentProvider {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly webhookToken: string;

  private static readonly paymentMethodMap: Record<string, string> = {
    BCA_VA: 'BCA',
    BNI_VA: 'BNI',
    BRI_VA: 'BRI',
    MANDIRI_VA: 'MANDIRI',
    PERMATA_VA: 'PERMATA',
    GOPAY: 'ID_GOPAY',
    SHOPEEPAY: 'ID_SHOPEEPAY',
    QRIS: 'QRIS',
    CREDIT_CARD: 'CREDIT_CARD',
  };

  constructor() {
    this.baseUrl = env.xenditApiUrl;
    this.webhookToken = env.xenditWebhookToken;
    this.authHeader = `Basic ${Buffer.from(`${env.xenditSecretKey}:`).toString('base64')}`;
  }

  async createTransaction(params: CreateTransactionParams): Promise<TransactionResponse> {
    const xenditPaymentMethod = XenditProvider.paymentMethodMap[params.paymentMethod] || params.paymentMethod;

    const payload = {
      external_id: params.orderNumber,
      amount: params.grossAmount,
      payer_email: params.customerEmail,
      description: `Payment for ${params.eventTitle} (${params.quantity} tickets)`,
      invoice_duration: params.expiryDurationMinutes * 60,
      payment_methods: [xenditPaymentMethod],
      customer: {
        given_names: params.customerName,
        email: params.customerEmail,
      },
      items: [
        {
          name: params.eventTitle,
          quantity: params.quantity,
          price: params.ticketPrice,
          category: 'Event Ticket',
        },
        {
          name: 'Admin Fee',
          quantity: 1,
          price: params.adminFee,
          category: 'Fee',
        },
      ],
    };

    logger.info({ orderNumber: params.orderNumber, mappedMethod: xenditPaymentMethod }, 'Creating Xendit invoice');

    const response = await fetch(`${this.baseUrl}/v2/invoices`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: this.authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error({ status: response.status, body: errorBody, orderNumber: params.orderNumber }, 'Xendit API error');
      throw new Error(`Xendit API error: ${response.status} - ${errorBody}`);
    }

    const data = (await response.json()) as { id: string; invoice_url: string };

    logger.info({ orderNumber: params.orderNumber, invoiceId: data.id }, 'Xendit invoice created');

    return {
      providerToken: data.id,
      checkoutUrl: data.invoice_url,
    };
  }

  verifyWebhookSignature(payload: any, signatureStr?: string): boolean {
    // Xendit uses x-callback-token header
    if (!signatureStr) return false;
    return signatureStr === this.webhookToken;
  }

  parseWebhookPayload(payload: any): WebhookParsedData {
    // Xendit status example: 'PAID', 'EXPIRED', 'SETTLED'
    let mappedStatus: WebhookParsedData['status'] = 'PENDING';

    if (payload.status === 'PAID' || payload.status === 'SETTLED') {
      mappedStatus = 'PAID';
    } else if (payload.status === 'EXPIRED') {
      mappedStatus = 'EXPIRED';
    } else if (payload.status === 'PENDING') {
      mappedStatus = 'PENDING';
    }

    return {
      // Xendit Invoice uses external_id for our orderNumber reference
      orderNumber: payload.external_id || payload.id,
      status: mappedStatus,
      rawPayload: payload,
    };
  }
}
