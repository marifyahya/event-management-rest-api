import { prisma } from '../db/index.js';
import { NotFoundError, ConflictError } from '../utils/app-error.js';
import { TICKET_STATUS } from '../constants/ticket-status.js';

export class CheckInService {
  async processCheckIn(qrToken: string) {
    if (!qrToken) {
      throw new Error('QR token is required');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { qrToken },
      include: {
        event: {
          select: {
            title: true,
            startAt: true,
            location: true,
          },
        },
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found or invalid QR token');
    }

    if (ticket.usedAt !== null || ticket.status === TICKET_STATUS.USED) {
      throw new ConflictError('Ticket has already been used!');
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        usedAt: new Date(),
        status: TICKET_STATUS.USED,
      },
      include: {
        event: {
          select: { title: true },
        },
        user: {
          select: { fullName: true },
        },
      },
    });

    return updatedTicket;
  }
}

export const checkInService = new CheckInService();
