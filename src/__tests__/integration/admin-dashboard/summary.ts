import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { prismaMock } from '../../mock-prisma.js';
import { generateToken } from '../../../libs/jwt.js';
import { ORDER_STATUS } from '../../../constants/order-status.js';

describe('Admin Dashboard API Endpoints', () => {
  const adminToken = generateToken({ id: 1, role: 'admin' });
  const userToken = generateToken({ id: 2, role: 'participant' });

  it('should return 401 if no token provided', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
  });

  it('should return 401 if user is not admin', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(401);
  });

  it('should return dashboard summary successfully for admin', async () => {
    // Mock the Prisma calls
    prismaMock.order.groupBy.mockResolvedValue([
      { status: ORDER_STATUS.PAID, _count: { _all: 10 } },
      { status: ORDER_STATUS.PENDING, _count: { _all: 5 } },
      { status: ORDER_STATUS.EXPIRED, _count: { _all: 2 } }
    ] as any);

    prismaMock.ticket.count.mockResolvedValue(50);

    prismaMock.order.aggregate.mockResolvedValue({
      _sum: { totalAmount: 5000000 }
    } as any);

    // Active events
    prismaMock.event.count.mockResolvedValueOnce(5);
    // Total events
    prismaMock.event.count.mockResolvedValueOnce(12);

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toMatchObject({
      totalOrder: 17,
      totalOrderPaid: 10,
      totalOrderPending: 5,
      totalOrderExpired: 2,
      totalTicket: 50,
      totalRevenue: 5000000,
      totalActiveEvents: 5,
      totalEvents: 12
    });
  });
});
