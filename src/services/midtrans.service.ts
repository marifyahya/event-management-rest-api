import { env } from '../config/env.js';
import { logger } from '../libs/logger.js';

const SNAP_SANDBOX_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions';
const SNAP_PRODUCTION_URL = 'https://app.midtrans.com/snap/v1/transactions';

type CreateTransactionParams = {
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

type SnapResponse = {
  token: string;
  redirectUrl: string;
};

class MidtransService {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor() {
    this.baseUrl = env.midtransIsProduction ? SNAP_PRODUCTION_URL : SNAP_SANDBOX_URL;
    this.authHeader = `Basic ${Buffer.from(`${env.midtransServerKey}:`).toString('base64')}`;
  }

  /**
   * Create a Midtrans Snap transaction and return the snap token + redirect URL.
   *
   * @param params - Transaction details (order, customer, items)
   * @returns Snap token and redirect URL for payment
   */
  async createTransaction(params: CreateTransactionParams): Promise<SnapResponse> {
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
          price: params.adminFee, // This is the total admin fee
          quantity: 1, // Quantity 1 for the total fee sum
        },
      ],
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
      },
      enabled_payments: [params.paymentMethod],
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
      token: data.token,
      redirectUrl: data.redirect_url,
    };
  }
}

export const midtransService = new MidtransService();
