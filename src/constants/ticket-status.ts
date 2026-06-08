export const TICKET_STATUS = {
  VALID: 'valid',
  USED: 'used',
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];
