import { randomUUID } from 'node:crypto';
import { redisClient } from '../libs/redis.js';
import { ConflictError } from '../utils/app-error.js';
import { RESERVATION_STATUS } from '../constants/status.js';

class SlotRedisService {
  private decrScript = `
    local remaining = redis.call('DECRBY', KEYS[1], ARGV[1])
    if remaining < 0 then
      redis.call('INCRBY', KEYS[1], ARGV[1])
      return -1
    end
    return remaining
  `;

  private slotKey(eventId: number): string {
    return `event:${eventId}:slots`;
  }

  private reservationKey(eventId: number, reservationId: string): string {
    return `event:${eventId}:reservation:${reservationId}`;
  }

  private lookupKey(reservationId: string): string {
    return `reservation:${reservationId}`;
  }

  async reserveSlot(eventId: number, userId: number, quantity: number): Promise<{ reservationId: string }> {
    const key = this.slotKey(eventId);
    const result = await redisClient.eval(this.decrScript, 1, key, String(quantity));

    if (Number(result) < 0) {
      throw new ConflictError('Event is sold out');
    }

    const reservationId = randomUUID();
    const reservationData = JSON.stringify({
      userId,
      eventId,
      status: RESERVATION_STATUS.HELD,
      quantity,
    });

    await redisClient.setex(this.reservationKey(eventId, reservationId), 300, reservationData);
    await redisClient.setex(this.lookupKey(reservationId), 300, reservationData);

    return { reservationId };
  }

  async releaseSlot(eventId: number, quantity: number): Promise<void> {
    await redisClient.incrby(this.slotKey(eventId), quantity);
  }

  async seedSlot(eventId: number, capacity: number, usedCount: number): Promise<void> {
    await redisClient.set(this.slotKey(eventId), capacity - usedCount);
  }

  async getReservation(reservationId: string): Promise<{ userId: number; eventId: number; status: string } | null> {
    const data = await redisClient.get(this.lookupKey(reservationId));
    if (!data) return null;
    return JSON.parse(data);
  }

  async deleteReservation(eventId: number, reservationId: string): Promise<void> {
    await redisClient.del(this.reservationKey(eventId, reservationId));
    await redisClient.del(this.lookupKey(reservationId));
  }

  async getRemainingSlots(eventId: number): Promise<number> {
    const remaining = await redisClient.get(this.slotKey(eventId));
    return remaining ? Number(remaining) : 0;
  }
}

export const slotRedisService = new SlotRedisService();
