import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { eventService } from '../services/event.service.js';
import { ConflictError, NotFoundError } from '../utils/app-error.js';
import { EVENT_STATUS } from '../constants/event-status.js';

export const store = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventService.store({ ...req.body, organizerId: req.user!.id });

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: event,
  });
});

export const index = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, title, category, status } = req.query;
  const query = {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    title: title ? String(title) : undefined,
    category: category ? String(category) : undefined,
    status: status ? String(status) : undefined,
    location: req.query.location ? String(req.query.location) : undefined,
  };

  const events = await eventService.getAllEvent(query);

  res.json({
    success: true,
    message: 'Events retrieved successfully',
    data: events.data,
    pagination: events.pagination,
  });
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new NotFoundError('Event not found');
  }

  const event = await eventService.findById(id);
  if (!event) {
    throw new NotFoundError('Event not found');
  }

  res.json({
    success: true,
    message: 'Event retrieved successfully',
    data: event,
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new NotFoundError('Event not found');
  }

  const event = await eventService.findById(id);
  if (!event) {
    throw new NotFoundError('Event not found');
  }

  if (event.status !== EVENT_STATUS.DRAFT) {
    throw new ConflictError('Only events with draft status can be updated');
  }

  const eventUpdate = await eventService.update(id, req.body);

  res.json({
    success: true,
    message: 'Event updated successfully',
    data: eventUpdate,
  });
});
