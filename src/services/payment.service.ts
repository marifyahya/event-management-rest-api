import { env } from '../config/env.js';
import { logger } from '../libs/logger.js';
import type { PaymentProvider } from '../providers/payment/payment-provider.interface.js';
import { MidtransProvider } from '../providers/payment/midtrans.provider.js';
import { XenditProvider } from '../providers/payment/xendit.provider.js';

class PaymentFactory {
  private static instance: PaymentProvider;

  static getProvider(): PaymentProvider {
    if (!this.instance) {
      const providerType = env.paymentGatewayProvider || 'midtrans';

      switch (providerType.toLowerCase()) {
        case 'xendit':
          logger.info('Initializing Xendit Payment Provider');
          this.instance = new XenditProvider();
          break;
        case 'midtrans':
        default:
          logger.info('Initializing Midtrans Payment Provider');
          this.instance = new MidtransProvider();
          break;
      }
    }

    return this.instance;
  }
}

export const paymentService = PaymentFactory.getProvider();
