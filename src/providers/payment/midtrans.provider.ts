import crypto from 'crypto';
import { env } from '../../config/env.js';
import { logger } from '../../libs/logger.js';
import {
  type CreateTransactionParams,
  type TransactionResponse,
  type PaymentProvider,
  type WebhookParsedData,
} from './payment-provider.interface.js';

export class MidtransProvider implements PaymentProvider {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly serverKey: string;

  private static readonly paymentMethodMap: Record<string, string> = {
    BCA_VA: 'bca_va',
    BNI_VA: 'bni_va',
    BRI_VA: 'bri_va',
    MANDIRI_VA: 'echannel',
    PERMATA_VA: 'permata_va',
    GOPAY: 'gopay',
    SHOPEEPAY: 'shopeepay',
    QRIS: 'qris',
    CREDIT_CARD: 'credit_card',
  };

  constructor() {
    this.baseUrl = env.midtransApiUrl;
    this.serverKey = env.midtransServerKey;
    this.authHeader = `Basic ${Buffer.from(`${this.serverKey}:`).toString('base64')}`;
  }

  async createTransaction(params: CreateTransactionParams): Promise<TransactionResponse> {
    const payload = {
      transaction_details: {
        order_id: params.orderNumber,
        gross_amount: params.grossAmount,
      },
      item_details: [
        {
          id: `${params.orderNumber}-ticket`,
          name: params.eventTitle,
          price: params.ticketPrice,
          quantity: params.quantity,
        },
        {
          id: `${params.orderNumber}-fee`,
          name: 'Admin Fee',
          price: params.adminFee,
          quantity: 1,
        },
      ],
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
      },
      enabled_payments: [MidtransProvider.paymentMethodMap[params.paymentMethod] || params.paymentMethod],
      custom_expiry: {
        expiry_duration: params.expiryDurationMinutes,
        unit: 'minute',
      },
    };

    logger.info({ orderNumber: params.orderNumber }, 'Creating Midtrans Snap transaction');

    const response = await fetch(this.baseUrl, {
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
      logger.error(
        { status: response.status, body: errorBody, orderNumber: params.orderNumber },
        'Midtrans Snap API error',
      );
      throw new Error(`Midtrans API error: ${response.status} - ${errorBody}`);
    }

    const data = (await response.json()) as { token: string; redirect_url: string };

    logger.info({ orderNumber: params.orderNumber }, 'Midtrans Snap transaction created');

    return {
      providerToken: data.token,
      checkoutUrl: data.redirect_url,
    };
  }

  verifyWebhookSignature(payload: any): boolean {
    // Midtrans uses SHA512(order_id + status_code + gross_amount + server_key)
    const { order_id, status_code, gross_amount, signature_key } = payload;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return false;
    }

    const inputString = `${order_id}${status_code}${gross_amount}${this.serverKey}`;
    const generatedSignature = crypto.createHash('sha512').update(inputString).digest('hex');

    return generatedSignature === signature_key;
  }

  parseWebhookPayload(payload: any): WebhookParsedData {
    const { order_id, transaction_id, transaction_status, fraud_status } = payload;

    let mappedStatus: WebhookParsedData['status'] = 'PENDING';

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'challenge') {
        mappedStatus = 'PENDING';
      } else {
        mappedStatus = 'PAID';
      }
    } else if (transaction_status === 'deny' || transaction_status === 'cancel') {
      mappedStatus = 'CANCELLED';
    } else if (transaction_status === 'expire') {
      mappedStatus = 'EXPIRED';
    } else if (transaction_status === 'pending') {
      mappedStatus = 'PENDING';
    }

    return {
      orderNumber: order_id,
      status: mappedStatus,
      providerTransactionId: transaction_id ?? undefined,
      rawPayload: payload,
    };
  }
}
