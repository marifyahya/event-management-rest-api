export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  DENY: 'deny',
  CANCEL: 'cancel',
  EXPIRE: 'expire',
  FAILURE: 'failure',
} as const;

export const PAYMENT_STATUS_LABEL = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.PAID]: 'Paid',
  [PAYMENT_STATUS.DENY]: 'Deny',
  [PAYMENT_STATUS.CANCEL]: 'Cancel',
  [PAYMENT_STATUS.EXPIRE]: 'Expire',
  [PAYMENT_STATUS.FAILURE]: 'Failure',
};

export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);
