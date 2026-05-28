import { randomUUID } from 'crypto';
import { TICKET_STATUS } from '../constants/status.js';

class TicketService {
  generateTickets(orderId: string, eventId: number, userId: number, quantity: number) {
    return Array.from({ length: quantity }, (_, i) => ({
      orderId,
      eventId,
      userId,
      ticketCode: `TCK-${Date.now().toString(36).toUpperCase()}-${i}-${randomUUID().slice(0, 4).toUpperCase()}`,
      qrToken: randomUUID(),
      status: TICKET_STATUS.ACTIVE,
    }));
  }
}

export const ticketService = new TicketService();
