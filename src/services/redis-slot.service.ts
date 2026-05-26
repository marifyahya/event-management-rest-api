import { randomUUID } from 'node:crypto';
import { redisClient } from '../libs/redis.js';
import { ConflictError } from '../utils/app-error.js';

class SlotRedisService {
  private slotKey(eventId: number): string {
    return `event:${eventId}:slots`;
  }

  private reservationKey(eventId: number, reservationId: string): string {
    return `event:${eventId}:reservation:${reservationId}`;
  }

  private lookupKey(reservationId: string): string {
    return `reservation:${reservationId}`;
  }

  async reserveSlot(eventId: number, userId: number): Promise<{ reservationId: string }> {
    const key = this.slotKey(eventId);
    const remaining = await redisClient.decr(key);

    if (remaining < 0) {
      await redisClient.incr(key);
      throw new ConflictError('Event is sold out');
    }

    const reservationId = randomUUID();
    const reservationData = JSON.stringify({
      userId,
      eventId,
      status: 'held',
    });

    await redisClient.setex(this.reservationKey(eventId, reservationId), 300, reservationData);
    await redisClient.setex(this.lookupKey(reservationId), 300, reservationData);

    return { reservationId };
  }

  async releaseSlot(eventId: number): Promise<void> {
    await redisClient.incr(this.slotKey(eventId));
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
