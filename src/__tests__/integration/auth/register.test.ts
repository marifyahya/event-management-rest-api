import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { prismaMock } from '../../mock-prisma.js';

describe('POST /api/auth/register', () => {
  it('should register a new user successfully (Positive Case)', async () => {
    // Mock the user finding (user does not exist)
    prismaMock.user.findUnique.mockResolvedValue(null);

    // Mock the user creation
    prismaMock.user.create.mockResolvedValue({
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

    const response = await request(app).post('/api/auth/register').send({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('User registered successfully');
    expect(response.body.data.email).toBe('john@example.com');
  });

  it('should fail if email is already registered (Negative Case)', async () => {
    // Mock the user finding (user already exists)
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      fullName: 'Existing User',
      email: 'existing@example.com',
      role: 'user',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const response = await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      email: 'existing@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Email already exists');
  });

  it('should fail if validation fails (Negative Case)', async () => {
    const response = await request(app).post('/api/auth/register').send({
      fullName: '',
      email: 'invalid-email',
      password: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });
});
