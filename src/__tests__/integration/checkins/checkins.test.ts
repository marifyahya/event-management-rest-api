import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { prismaMock } from '../../mock-prisma.js';
import { generateToken } from '../../../libs/jwt.js';
import { TICKET_STATUS } from '../../../constants/ticket-status.js';

describe('Check-ins API Endpoints', () => {
  const staffToken = generateToken({ id: 5, role: 'staff' });
  const userToken = generateToken({ id: 10, role: 'user' });

  const mockTicket = {
    id: 'ticket-uuid-1',
    orderId: 'order-uuid-1',
    eventId: 1,
    userId: 10,
    ticketCode: 'TCK-12345',
    qrToken: 'qr-token-123',
    status: TICKET_STATUS.VALID,
    usedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    event: {
      title: 'New Tech Summit',
      startAt: new Date('2027-01-10T09:00:00.000Z'),
      location: 'Jakarta',
    },
    user: {
      fullName: 'John Doe',
      email: 'john@example.com',
    },
  };

  describe('POST /api/admin/check-ins', () => {
    it('should successfully check in a valid ticket (Positive Case)', async () => {
      prismaMock.ticket.findUnique.mockResolvedValue(mockTicket as any);

      const updatedTicket = {
        ...mockTicket,
        status: TICKET_STATUS.USED,
        usedAt: new Date(),
      };
      prismaMock.ticket.update.mockResolvedValue(updatedTicket as any);

      const response = await request(app)
        .post('/api/admin/check-ins')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ qrToken: 'qr-token-123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Check-in successful!');
      expect(response.body.data.ticketCode).toBe('TCK-12345');
      expect(response.body.data.checkedInAt).toBeDefined();
    });

    it('should return conflict error if the ticket is already used (Negative Case)', async () => {
      const usedTicket = {
        ...mockTicket,
        status: TICKET_STATUS.USED,
        usedAt: new Date(),
      };
      prismaMock.ticket.findUnique.mockResolvedValue(usedTicket as any);

      const response = await request(app)
        .post('/api/admin/check-ins')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ qrToken: 'qr-token-123' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Ticket has already been used!');
    });

    it('should return 404 if the ticket is not found (Negative Case)', async () => {
      prismaMock.ticket.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/admin/check-ins')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ qrToken: 'non-existent-qr-token' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Ticket not found or invalid QR token');
    });

    it('should forbid access for unauthorized roles like user (Negative Case)', async () => {
      const response = await request(app)
        .post('/api/admin/check-ins')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ qrToken: 'qr-token-123' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Access denied: Insufficient permissions');
    });

    it('should fail validation when qrToken is missing (Negative Case)', async () => {
      const response = await request(app)
        .post('/api/admin/check-ins')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
});
