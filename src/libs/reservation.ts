import { getRedisClient } from './redis.js';

/** Reservation TTL in seconds (10 minutes) */
export const RESERVATION_TTL = 10 * 60;

/**
 * Lua script for atomic stock reservation.
 *
 * KEYS[1] = event:{eventId}:stock             (Remaining event stock)
 * KEYS[2] = reservation:{orderNumber}         (Reservation tied to order)
 * ARGV[1] = quantity                           (Requested ticket quantity)
 * ARGV[2] = ttl                                (TTL in seconds)
 *
 * Returns:
 *   1  = Success (stock decremented, reservation created)
 *  -1  = Insufficient stock
 *  -2  = Stock key not found (event not yet published)
 */
const RESERVE_SCRIPT = `
  local stockKey = KEYS[1]
  local reservationKey = KEYS[2]
  local quantity = tonumber(ARGV[1])
  local ttl = tonumber(ARGV[2])

  -- Check if stock key exists
  local exists = redis.call('EXISTS', stockKey)
  if exists == 0 then
    return -2
  end

  -- Check remaining stock
  local currentStock = tonumber(redis.call('GET', stockKey))
  if currentStock < quantity then
    return -1
  end

  -- Decrement stock and create reservation
  redis.call('DECRBY', stockKey, quantity)
  redis.call('SETEX', reservationKey, ttl, quantity)

  return 1
`;

/**
 * Lua script for releasing a reservation (when order expires or is cancelled).
 *
 * KEYS[1] = event:{eventId}:stock
 * KEYS[2] = reservation:{orderNumber}
 *
 * Returns:
 *   1 = Stock restored successfully
 *   0 = Reservation not found (already expired or released)
 */
const RELEASE_SCRIPT = `
  local stockKey = KEYS[1]
  local reservationKey = KEYS[2]

  -- Get reserved quantity
  local quantity = redis.call('GET', reservationKey)
  if not quantity then
    return 0
  end

  -- Restore stock and delete reservation
  redis.call('INCRBY', stockKey, tonumber(quantity))
  redis.call('DEL', reservationKey)

  return 1
`;

export type ReservationResult =
  | { success: true; expiresAt: Date }
  | { success: false; reason: 'sold_out' | 'event_not_available' };

/**
 * Atomically reserve event stock using a Redis Lua script.
 * Uses the orderNumber as the reservation key.
 *
 * @param eventId - The event to reserve stock for
 * @param orderNumber - The order number used as reservation identifier
 * @param quantity - Number of tickets to reserve
 * @returns Reservation result with expiry on success, or failure reason
 */
export async function reserveStock(eventId: number, orderNumber: string, quantity: number): Promise<ReservationResult> {
  const redis = getRedisClient();

  const stockKey = `event:${eventId}:stock`;
  const reservationKey = `reservation:${orderNumber}`;

  const result = await redis.eval(
    RESERVE_SCRIPT,
    2, // Number of KEYS
    stockKey, // KEYS[1]
    reservationKey, // KEYS[2]
    quantity, // ARGV[1]
    RESERVATION_TTL, // ARGV[2]
  );

  if (result === 1) {
    const expiresAt = new Date(Date.now() + RESERVATION_TTL * 1000);
    return { success: true, expiresAt };
  }

  if (result === -1) {
    return { success: false, reason: 'sold_out' };
  }

  return { success: false, reason: 'event_not_available' };
}

/**
 * Release a previously reserved stock (for expired or cancelled orders).
 *
 * @param eventId - The event whose stock should be restored
 * @param orderNumber - The order number whose reservation to release
 * @returns `true` if stock was restored, `false` if reservation was already gone
 */
export async function releaseReservation(eventId: number, orderNumber: string): Promise<boolean> {
  const redis = getRedisClient();

  const stockKey = `event:${eventId}:stock`;
  const reservationKey = `reservation:${orderNumber}`;

  const result = await redis.eval(RELEASE_SCRIPT, 2, stockKey, reservationKey);

  return result === 1;
}

/**
 * Confirm a reservation after successful payment.
 * Deletes the reservation key so the stock is not restored on expiry.
 *
 * @param orderNumber - The order number whose reservation to confirm
 */
export async function confirmReservation(orderNumber: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`reservation:${orderNumber}`);
}

/**
 * Initialize event stock in Redis when an event is published.
 *
 * @param eventId - The event to initialize stock for
 * @param capacity - Total ticket capacity
 */
export async function initEventStock(eventId: number, capacity: number): Promise<void> {
  const redis = getRedisClient();
  await redis.set(`event:${eventId}:stock`, capacity);
}
