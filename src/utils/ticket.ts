import { randomBytes } from 'crypto';

/**
 * Generate a unique, human-readable ticket code.
 * Format: TKT-<8 random uppercase hex chars>
 * Example: TKT-3F9A2C1D
 */
export function generateTicketCode(): string {
  return `TKT-${randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Generate a secure random QR token for ticket scanning.
 * Uses 16 random bytes (128-bit entropy) encoded as hex.
 */
export function generateQrToken(): string {
  return randomBytes(16).toString('hex');
}
