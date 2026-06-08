import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { prismaMock } from '../../mock-prisma.js';
import { paymentService } from '../../../services/payment.service.js';
import { ORDER_STATUS } from '../../../constants/order-status.js';

describe('Payments Webhook API Endpoints', () => {
  const mockOrder = {
    id: 'order-uuid-123',
    orderNumber: 'ORD-12345678',
    eventId: 1,
    userId: 10,
    quantity: 2,
    subtotalAmount: 150000,
    adminFee: 5000,
    totalAmount: 155000,
    status: ORDER_STATUS.PENDING,
    expiresAt: new Date(Date.now() + 900000),
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ticketPdfUrl: null,
    payment: {
      id: 'pay-uuid',
      status: 'PENDING',
    },
    user: {
      id: 10,
      fullName: 'John Doe',
      email: 'john@example.com',
    },
    event: {
      id: 1,
      title: 'New Tech Summit',
      capacity: 150,
    },
  };

  beforeEach(() => {
    // Support both callback-based and array-of-promises-based transactions
    prismaMock.$transaction.mockImplementation(async (arg) => {
      if (typeof arg === 'function') {
        return arg(prismaMock);
      }
      return Promise.all(arg);
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('should process PAID webhook callback successfully (Positive Case)', async () => {
      vi.spyOn(paymentService, 'verifyWebhookSignature').mockReturnValue(true);
      vi.spyOn(paymentService, 'parseWebhookPayload').mockReturnValue({
        orderNumber: 'ORD-12345678',
        status: 'PAID',
        providerTransactionId: 'TX-MIDTRANS-123',
        rawPayload: { transaction_status: 'settlement' },
      });

      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);
      prismaMock.payment.update.mockResolvedValue({} as any);
      prismaMock.order.update.mockResolvedValue({} as any);
      prismaMock.ticket.createMany.mockResolvedValue({ count: 2 });

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('x-callback-token', 'valid-token')
        .send({ transaction_status: 'settlement' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify DB updates were triggered
      expect(prismaMock.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderNumber: 'ORD-12345678' },
        }),
      );
      expect(prismaMock.payment.update).toHaveBeenCalled();
      expect(prismaMock.order.update).toHaveBeenCalled();
      expect(prismaMock.ticket.createMany).toHaveBeenCalled();
    });

    it('should process EXPIRED webhook callback successfully (Positive Case)', async () => {
      vi.spyOn(paymentService, 'verifyWebhookSignature').mockReturnValue(true);
      vi.spyOn(paymentService, 'parseWebhookPayload').mockReturnValue({
        orderNumber: 'ORD-12345678',
        status: 'EXPIRED',
        providerTransactionId: 'TX-MIDTRANS-123',
        rawPayload: { transaction_status: 'expire' },
      });

      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);
      prismaMock.payment.update.mockResolvedValue({} as any);
      prismaMock.order.update.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('x-callback-token', 'valid-token')
        .send({ transaction_status: 'expire' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(prismaMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-uuid-123' },
          data: { status: ORDER_STATUS.EXPIRED },
        }),
      );
    });

    it('should process CANCELLED webhook callback successfully (Positive Case)', async () => {
      vi.spyOn(paymentService, 'verifyWebhookSignature').mockReturnValue(true);
      vi.spyOn(paymentService, 'parseWebhookPayload').mockReturnValue({
        orderNumber: 'ORD-12345678',
        status: 'CANCELLED',
        providerTransactionId: 'TX-MIDTRANS-123',
        rawPayload: { transaction_status: 'cancel' },
      });

      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);
      prismaMock.payment.update.mockResolvedValue({} as any);
      prismaMock.order.update.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('x-callback-token', 'valid-token')
        .send({ transaction_status: 'cancel' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(prismaMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-uuid-123' },
          data: { status: ORDER_STATUS.CANCELLED },
        }),
      );
    });

    it('should fail if webhook signature verification fails (Negative Case)', async () => {
      vi.spyOn(paymentService, 'verifyWebhookSignature').mockReturnValue(false);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('x-callback-token', 'invalid-token')
        .send({ transaction_status: 'settlement' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
    });
  });
});
