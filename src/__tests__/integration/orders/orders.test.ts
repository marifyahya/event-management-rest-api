import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { prismaMock } from '../../mock-prisma.js';
import { generateToken } from '../../../libs/jwt.js';
import { EVENT_STATUS } from '../../../constants/event-status.js';
import { ORDER_STATUS } from '../../../constants/order-status.js';

describe('Orders API Endpoints', () => {
  const userToken = generateToken({ id: 10, role: 'user' });
  const mockEvent = {
    id: 1,
    organizerId: 1,
    title: 'New Tech Summit',
    description: 'An upcoming technology event.',
    category: 'technology',
    location: 'Jakarta',
    startAt: new Date('2027-01-10T09:00:00.000Z'),
    endAt: new Date('2027-01-10T17:00:00.000Z'),
    status: EVENT_STATUS.PUBLISHED,
    capacity: 150,
    price: 75000,
    publishedAt: new Date(),
    cancelReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

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
    payment: null,
    event: mockEvent,
    user: {
      id: 10,
      fullName: 'John Doe',
      email: 'john@example.com',
    },
  };

  describe('POST /api/orders', () => {
    it('should create an order successfully (Positive Case)', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.order.create.mockResolvedValue(mockOrder);

      const response = await request(app).post('/api/orders').set('Authorization', `Bearer ${userToken}`).send({
        eventId: 1,
        quantity: 2,
        paymentMethod: 'bank_transfer',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('order-uuid-123');
      expect(response.body.data.totalAmount).toBe(155000);
    });

    it('should fail to create order if event does not exist or is not published (Negative Case)', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      const response = await request(app).post('/api/orders').set('Authorization', `Bearer ${userToken}`).send({
        eventId: 999,
        quantity: 2,
        paymentMethod: 'bank_transfer',
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Event not found');
    });

    it('should fail validation when quantity is invalid (Negative Case)', async () => {
      const response = await request(app).post('/api/orders').set('Authorization', `Bearer ${userToken}`).send({
        eventId: 1,
        quantity: 10, // Max 6 in validator
        paymentMethod: 'bank_transfer',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order detail by ID (Positive Case)', async () => {
      prismaMock.order.findUnique.mockResolvedValue(mockOrder);

      const response = await request(app).get('/api/orders/order-uuid-123').set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('order-uuid-123');
    });

    it('should return 404 when order is not found (Negative Case)', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/orders/non-existent-order')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Order not found');
    });
  });
  describe('GET /api/admin/orders', () => {
    const adminToken = generateToken({ id: 1, role: 'admin' });

    it('should return all orders for admin (Positive Case)', async () => {
      prismaMock.order.findMany.mockResolvedValue([mockOrder] as any);
      prismaMock.order.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should export orders to CSV (Positive Case)', async () => {
      prismaMock.order.findMany
        .mockResolvedValueOnce([mockOrder] as any)
        .mockResolvedValueOnce([]); // To break the while loop

      const response = await request(app)
        .get('/api/admin/orders?export=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment; filename="orders-export.csv"');
    });

    it('should export orders to XLSX (Positive Case)', async () => {
      prismaMock.order.findMany
        .mockResolvedValueOnce([mockOrder] as any)
        .mockResolvedValueOnce([]); // To break the while loop

      const response = await request(app)
        .get('/api/admin/orders?export=xlsx')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheetml');
      expect(response.headers['content-disposition']).toContain('attachment; filename="orders-export.xlsx"');
    });
  });
});
