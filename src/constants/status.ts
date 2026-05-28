export const REGISTRATION_STATUS = {
  REGISTERED: 'registered',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SETTLEMENT: 'settlement',
  EXPIRED: 'expired',
  FAILED: 'failed',
} as const;

export const TICKET_STATUS = {
  ACTIVE: 'active',
  USED: 'used',
} as const;

export const RESERVATION_STATUS = {
  HELD: 'held',
} as const;
