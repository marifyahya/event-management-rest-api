export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS_LABEL = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.PAID]: 'Paid',
  [ORDER_STATUS.EXPIRED]: 'Expired',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
};

export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);
