import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { generateToken } from '../../../libs/jwt.js';

describe('POST /api/auth/logout', () => {
  it('should logout user successfully when authenticated (Positive Case)', async () => {
    // Generate a valid JWT token
    const token = generateToken({ id: 1, role: 'user' });

    const response = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Logout successful');
  });

  it('should fail if no token is provided (Negative Case)', async () => {
    const response = await request(app).post('/api/auth/logout');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Unauthorized');
  });
});
