import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { prismaMock } from '../../mock-prisma.js';
import { generateToken } from '../../../libs/jwt.js';
import { EVENT_STATUS } from '../../../constants/event-status.js';

describe('Admin Events API Endpoints', () => {
  const adminToken = generateToken({ id: 1, role: 'admin' });
  const mockEvent = {
    id: 1,
    organizerId: 1,
    title: 'New Tech Summit',
    description: 'An upcoming technology event.',
    category: 'technology',
    location: 'Jakarta',
    startAt: new Date('2027-01-10T09:00:00.000Z'),
    endAt: new Date('2027-01-10T17:00:00.000Z'),
    status: EVENT_STATUS.DRAFT,
    capacity: 150,
    price: 75000,
    publishedAt: null,
    cancelReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    organizer: {
      fullName: 'Organizer Name',
    },
  };

  describe('POST /api/admin/events', () => {
    it('should create an event successfully (Positive Case)', async () => {
      prismaMock.event.create.mockResolvedValue(mockEvent);

      const response = await request(app).post('/api/admin/events').set('Authorization', `Bearer ${adminToken}`).send({
        title: 'New Tech Summit',
        description: 'An upcoming technology event.',
        capacity: 150,
        price: 75000,
        category: 'technology',
        location: 'Jakarta',
        startAt: '2027-01-10 09:00',
        endAt: '2027-01-10 17:00',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Tech Summit');
    });

    it('should fail validation when fields are invalid (Negative Case)', async () => {
      const response = await request(app).post('/api/admin/events').set('Authorization', `Bearer ${adminToken}`).send({
        title: 'Too short',
        capacity: 0,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/admin/events', () => {
    it('should return all events for admin (Positive Case)', async () => {
      prismaMock.event.findMany.mockResolvedValue([mockEvent]);
      prismaMock.event.count.mockResolvedValue(1);

      const response = await request(app).get('/api/admin/events').set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/admin/events/:id', () => {
    it('should return event detail by ID (Positive Case)', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);

      const response = await request(app).get('/api/admin/events/1').set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    it('should return 404 if event is not found (Negative Case)', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/admin/events/999').set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Event not found');
    });
  });

  describe('PATCH /api/admin/events/:id', () => {
    it('should update draft event details successfully (Positive Case)', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.event.update.mockResolvedValue({
        ...mockEvent,
        title: 'Updated Tech Summit',
      });

      const response = await request(app)
        .patch('/api/admin/events/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Tech Summit',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Tech Summit');
    });

    it('should throw conflict error when updating a non-draft event (Negative Case)', async () => {
      const publishedEvent = { ...mockEvent, status: EVENT_STATUS.PUBLISHED };
      prismaMock.event.findUnique.mockResolvedValue(publishedEvent);

      const response = await request(app)
        .patch('/api/admin/events/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Tech Summit',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Only events with draft status can be updated');
    });
  });

  describe('DELETE /api/admin/events/:id', () => {
    it('should delete archived event successfully (Positive Case)', async () => {
      const archivedEvent = { ...mockEvent, status: EVENT_STATUS.ARCHIVED };
      prismaMock.event.findUnique.mockResolvedValue(archivedEvent);
      prismaMock.event.update.mockResolvedValue({ ...archivedEvent, deletedAt: new Date() });

      const response = await request(app).delete('/api/admin/events/1').set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Event deleted successfully');
    });

    it('should fail delete when event is not archived (Negative Case)', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent); // Status: DRAFT

      const response = await request(app).delete('/api/admin/events/1').set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Only events with archived status can be deleted');
    });
  });

  describe('POST /api/admin/events/:id/publish', () => {
    it('should publish a draft event successfully (Positive Case)', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent); // status is DRAFT
      prismaMock.event.update.mockResolvedValue({
        ...mockEvent,
        status: EVENT_STATUS.PUBLISHED,
        publishedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/admin/events/1/publish')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(EVENT_STATUS.PUBLISHED);
    });
  });

  describe('POST /api/admin/events/:id/cancel', () => {
    it('should cancel a published event successfully (Positive Case)', async () => {
      const publishedEvent = { ...mockEvent, status: EVENT_STATUS.PUBLISHED };
      prismaMock.event.findUnique.mockResolvedValue(publishedEvent);
      prismaMock.event.update.mockResolvedValue({
        ...publishedEvent,
        status: EVENT_STATUS.CANCELLED,
        cancelReason: 'No interest',
      });

      const response = await request(app)
        .post('/api/admin/events/1/cancel')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cancelReason: 'No interest' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(EVENT_STATUS.CANCELLED);
    });
  });

  describe('POST /api/admin/events/:id/move-to-draft', () => {
    it('should move cancelled event back to draft successfully (Positive Case)', async () => {
      const cancelledEvent = { ...mockEvent, status: EVENT_STATUS.CANCELLED };
      prismaMock.event.findUnique.mockResolvedValue(cancelledEvent);
      prismaMock.event.update.mockResolvedValue({ ...cancelledEvent, status: EVENT_STATUS.DRAFT });

      const response = await request(app)
        .post('/api/admin/events/1/move-to-draft')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(EVENT_STATUS.DRAFT);
    });
  });

  describe('POST /api/admin/events/:id/archive', () => {
    it('should archive event successfully (Positive Case)', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.event.update.mockResolvedValue({ ...mockEvent, status: EVENT_STATUS.ARCHIVED });

      const response = await request(app)
        .post('/api/admin/events/1/archive')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(EVENT_STATUS.ARCHIVED);
    });
  });
});
