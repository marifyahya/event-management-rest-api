import { customAlphabet } from 'nanoid';

export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nanoid = customAlphabet(alphabet, 5);
  const randomSuffix = nanoid();

  return `ORD-${year}${month}${day}-${randomSuffix}`;
}
