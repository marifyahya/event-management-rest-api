import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { prismaMock } from '../../mock-prisma.js';
import { EVENT_STATUS } from '../../../constants/event-status.js';

describe('Public Events API Endpoints', () => {
  const mockEvent = {
    id: 1,
    organizerId: 10,
    title: 'Awesome Tech Conference',
    description: 'A great conference.',
    category: 'technology',
    location: 'Jakarta',
    startAt: new Date('2026-07-10T09:00:00.000Z'),
    endAt: new Date('2026-07-10T17:00:00.000Z'),
    status: EVENT_STATUS.PUBLISHED,
    capacity: 100,
    price: 50000,
    publishedAt: new Date(),
    cancelReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    organizer: {
      fullName: 'Organizer Name',
    },
  };

  describe('GET /api/events', () => {
    it('should retrieve published events successfully (Positive Case)', async () => {
      prismaMock.event.findMany.mockResolvedValue([mockEvent]);
      prismaMock.event.count.mockResolvedValue(1);

      const response = await request(app).get('/api/events').query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      // Public endpoint should omit organizerId
      expect(response.body.data[0].organizerId).toBeUndefined();
      expect(response.body.data[0].title).toBe('Awesome Tech Conference');
      expect(response.body.pagination.total).toBe(1);
    });

    it('should return bad request when query parameter validation fails (Negative Case)', async () => {
      const response = await request(app).get('/api/events').query({ page: 'invalid-page-number' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/events/:id', () => {
    it('should retrieve a published event detail successfully (Positive Case)', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);

      const response = await request(app).get('/api/events/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Awesome Tech Conference');
      // Public endpoint should omit organizerId
      expect(response.body.data.organizerId).toBeUndefined();
    });

    it('should return 404 when the event is not found (Negative Case)', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/events/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Event not found');
    });

    it('should return 404 when the event exists but is not published (Negative Case)', async () => {
      const draftEvent = { ...mockEvent, status: EVENT_STATUS.DRAFT };
      prismaMock.event.findUnique.mockResolvedValue(draftEvent);

      const response = await request(app).get('/api/events/1');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Event not found');
    });

    it('should return 404 when parameter ID is not a number (Negative Case)', async () => {
      const response = await request(app).get('/api/events/not-a-number');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Event not found');
    });
  });
});
