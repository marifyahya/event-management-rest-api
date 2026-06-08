import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { prismaMock, prismaRawMock } from '../../mock-prisma.js';
import bcrypt from 'bcrypt';

describe('POST /api/auth/login', () => {
  it('should login successfully with correct credentials (Positive Case)', async () => {
    // Generate a real bcrypt hash for the test
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Mock the user finding using prismaRawMock
    prismaRawMock.user.findUnique.mockResolvedValue({
      id: 1,
      fullName: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'user',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as any);

    // Mock updateLastLogin which uses standard prismaMock
    prismaMock.user.update.mockResolvedValue({} as any);

    const response = await request(app).post('/api/auth/login').send({
      email: 'john@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Login successful');
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.email).toBe('john@example.com');
  });

  it('should fail with incorrect password (Negative Case)', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);

    prismaRawMock.user.findUnique.mockResolvedValue({
      id: 1,
      fullName: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'user',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as any);

    const response = await request(app).post('/api/auth/login').send({
      email: 'john@example.com',
      password: 'wrongpassword',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid email or password');
  });

  it('should fail if user is not found (Negative Case)', async () => {
    prismaRawMock.user.findUnique.mockResolvedValue(null);

    const response = await request(app).post('/api/auth/login').send({
      email: 'unknown@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid email or password');
  });
});
