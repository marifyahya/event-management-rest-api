import { PaymentSuccessEmail } from './payment-success.email.js';

/**
 * Registry of all available Mailable classes.
 * Used by the background worker to re-instantiate the correct class
 * based on the string name passed through the queue payload.
 */
export const mailerRegistry = {
  'payment-success': PaymentSuccessEmail,
};

export type MailerName = keyof typeof mailerRegistry;
