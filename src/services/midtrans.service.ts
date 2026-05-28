import midtransClient from 'midtrans-client';
import { createHash } from 'node:crypto';
import { env } from '../config/env.js';

type SnapInstance = {
  createTransaction: (params: {
    transaction_details: { order_id: string; gross_amount: number };
  }) => Promise<{ token: string; redirect_url: string }>;
};

const SnapConstructor = midtransClient.Snap as unknown as new (
  options: { isProduction: boolean; serverKey: string; clientKey: string },
) => SnapInstance;

type NotificationResult = {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
  gross_amount?: string;
};

class MidtransService {
  private snap: SnapInstance;

  constructor() {
    this.snap = new SnapConstructor({
      isProduction: env.midtransIsProduction,
      serverKey: env.midtransServerKey,
      clientKey: env.midtransClientKey,
    });
  }

  async createTransaction(orderId: string, grossAmount: number) {
    const transaction = await this.snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
    });
    return {
      snapToken: transaction.token,
      snapRedirectUrl: transaction.redirect_url,
    };
  }

  async handleNotification(notificationJson: Record<string, unknown>): Promise<NotificationResult> {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
    } = notificationJson as Record<string, string | undefined>;

    const hash = createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${env.midtransServerKey}`)
      .digest('hex');

    if (signature_key && hash !== signature_key) {
      throw new Error('Invalid webhook signature');
    }

    return {
      order_id: order_id || '',
      transaction_status: transaction_status || '',
      fraud_status,
      payment_type,
      transaction_id,
      gross_amount,
    };
  }
}

export const midtransService = new MidtransService();
