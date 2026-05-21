import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { userService } from '../services/user.service.js';

export const index = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, name, email, role, isActive } = req.query;
  const query = {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    name: name ? String(name) : undefined,
    email: email ? String(email) : undefined,
    role: role ? String(role) : undefined,
    isActive:
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
  };

  const users = await userService.getAllUser(query);

  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: users.data,
    pagination: users.pagination,
  });
});
