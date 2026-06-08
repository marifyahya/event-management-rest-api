import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { prismaMock } from '../../mock-prisma.js';
import { generateToken } from '../../../libs/jwt.js';

describe('Users API Endpoints', () => {
  const adminToken = generateToken({ id: 1, role: 'admin' });
  const userToken = generateToken({ id: 2, role: 'user' });

  const mockUser = {
    id: 1,
    fullName: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  describe('GET /api/users', () => {
    it('should return a list of users for admin (Positive Case)', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser]);
      prismaMock.user.count.mockResolvedValue(1);

      const response = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should forbid access for non-admin users (Negative Case)', async () => {
      const response = await request(app).get('/api/users').set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user detail by ID (Positive Case)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    it('should return 404 if user not found (Negative Case)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not found');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user (Positive Case)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        id: 3,
        fullName: 'New User',
        email: 'newuser@example.com',
        role: 'staff',
      });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'staff',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@example.com');
    });

    it('should return 400 if email already exists (Negative Case)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser); // Email already exists

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Unique Name',
          email: 'admin@example.com',
          password: 'password123',
          role: 'staff',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already exists');
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user successfully (Positive Case)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        fullName: 'Updated Name',
      });

      const response = await request(app)
        .patch('/api/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe('Updated Name');
    });

    it('should return 404 if user not found for update (Negative Case)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/users/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Updated Name',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not found');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully (Positive Case)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      const response = await request(app)
        .delete('/api/users/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
    });

    it('should return 404 if user not found for delete (Negative Case)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/users/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not found');
    });
  });
});
