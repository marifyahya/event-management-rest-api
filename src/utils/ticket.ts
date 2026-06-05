import { customAlphabet } from 'nanoid';
import { randomBytes } from 'crypto';

const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 10);

/**
 * Generate a unique.
 * Format: TKT-<10 random secure chars>
 * Example: TKT-A7B8Z9K2XQ
 */
export function generateTicketCode(): string {
  return `TKT-${nanoid()}`;
}

/**
 * Generate a secure random QR token for ticket scanning.
 * Uses 16 random bytes (128-bit entropy) encoded as hex.
 */
export function generateQrToken(): string {
  return randomBytes(16).toString('hex');
}
