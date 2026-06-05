import type { Mailable } from '../services/email.service.js';
import { renderPaymentSuccessEmail } from '../templates/payment-success.template.js';

type PaymentSuccessData = {
  to: string;
  customerName: string;
  orderNumber: string;
  eventTitle: string;
  eventLocation: string;
  eventStartAt: Date;
  quantity: number;
  totalAmount: number;
  tickets: Array<{ ticketCode: string; qrToken: string }>;
};

export class PaymentSuccessEmail implements Mailable {
  public readonly name = 'payment-success';
  public readonly payload: PaymentSuccessData;

  constructor(data: PaymentSuccessData) {
    this.payload = data;
  }

  toMail() {
    return {
      to: this.payload.to,
      subject: `Payment Success - ${this.payload.eventTitle}`,
      html: renderPaymentSuccessEmail({
        to: this.payload.to,
        customerName: this.payload.customerName,
        orderNumber: this.payload.orderNumber,
        eventTitle: this.payload.eventTitle,
        eventLocation: this.payload.eventLocation,
        eventStartAt: this.payload.eventStartAt,
        quantity: this.payload.quantity,
        totalAmount: this.payload.totalAmount,
        tickets: this.payload.tickets,
      }),
    };
  }
}
