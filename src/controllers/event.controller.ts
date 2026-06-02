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
  const { page, limit, title, category, status, sortBy, sort } = req.query;
  const query = {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    title: title ? String(title) : undefined,
    category: category ? String(category) : undefined,
    status: status ? String(status) : undefined,
    location: req.query.location ? String(req.query.location) : undefined,
    sortBy: sortBy ? String(sortBy) : undefined,
    sort: sort ? String(sort) : undefined,
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

export const destroy = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new NotFoundError('Event not found');
  }

  await eventService.delete(id);

  res.json({
    success: true,
    message: 'Event deleted successfully',
  });
});

export const publish = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new NotFoundError('Event not found');
  }

  const event = await eventService.publish(id);

  res.json({
    success: true,
    message: 'Event published successfully',
    data: event,
  });
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new NotFoundError('Event not found');
  }

  const event = await eventService.cancel({ id, cancelReason: req.body.cancelReason });

  res.json({
    success: true,
    message: 'Event cancelled successfully',
    data: event,
  });
});

export const archive = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new NotFoundError('Event not found');
  }

  const event = await eventService.archive(id);

  res.json({
    success: true,
    message: 'Event archived successfully',
    data: event,
  });
});

export const moveToDraft = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new NotFoundError('Event not found');
  }

  const event = await eventService.moveToDraft(id);

  res.json({
    success: true,
    message: 'Event moved to draft successfully',
    data: event,
  });
});

export const forceDelete = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new NotFoundError('Event not found');
  }

  await eventService.delete(id);

  res.json({
    success: true,
    message: 'Event permanently deleted successfully',
  });
});

export const publicEventList = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, title, category, sortBy, sort } = req.query;
  const query = {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    title: title ? String(title) : undefined,
    category: category ? String(category) : undefined,
    status: EVENT_STATUS.PUBLISHED,
    location: req.query.location ? String(req.query.location) : undefined,
    sortBy: sortBy ? String(sortBy) : undefined,
    sort: sort ? String(sort) : 'desc',
  };

  const events = await eventService.getAllEvent(query);
  const data = events.data.map(({ organizerId, ...rest }) => rest);

  res.json({
    success: true,
    message: 'Events retrieved successfully',
    data: data,
    pagination: events.pagination,
  });
});

export const publicEventDetail = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new NotFoundError('Event not found');
  }

  const event = await eventService.findById(id);
  if (!event || event.status !== EVENT_STATUS.PUBLISHED) {
    throw new NotFoundError('Event not found');
  }

  const { organizerId, ...rest } = event;

  res.json({
    success: true,
    message: 'Event retrieved successfully',
    data: rest,
  });
});
