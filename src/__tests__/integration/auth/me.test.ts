import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { prismaMock } from '../../mock-prisma.js';
import { generateToken } from '../../../libs/jwt.js';

describe('GET /api/auth/me', () => {
  it('should return user profile successfully when authenticated (Positive Case)', async () => {
    // Generate a valid JWT token
    const token = generateToken({ id: 1, role: 'user' });

    // Mock the user finding
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('john@example.com');
  });

  it('should fail if no token is provided (Negative Case)', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Unauthorized');
  });

  it('should fail if token is invalid (Negative Case)', async () => {
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer invalid-token`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Unauthorized');
  });

  it('should fail if user is not found in database (Negative Case)', async () => {
    const token = generateToken({ id: 999, role: 'user' });

    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('User not found');
  });
});
