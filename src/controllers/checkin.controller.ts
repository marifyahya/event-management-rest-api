import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { checkInService } from '../services/checkin.service.js';

export const processCheckIn = asyncHandler(async (req: Request, res: Response) => {
  const { qrToken } = req.body;

  const ticket = await checkInService.processCheckIn(qrToken);

  res.json({
    success: true,
    message: 'Check-in successful!',
    data: {
      ticketCode: ticket.ticketCode,
      eventName: ticket.event.title,
      attendeeName: ticket.user.fullName,
      checkedInAt: ticket.usedAt,
    },
  });
});
