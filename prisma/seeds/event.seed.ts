import { PrismaClient } from '../../src/generated/prisma/client.js';
import { EVENT_STATUS } from '../../src/constants/event-status.js';

export async function seedEvents(prisma: PrismaClient) {
  const organizer = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
    select: { id: true },
  });

  if (!organizer) {
    throw new Error('Admin user not found. Run seedUsers first.');
  }

  const now = new Date();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  const events = [
    {
      title: 'Draft: Product Roadmap Meetup',
      description: 'Internal planning event still in preparation.',
      category: 'technology',
      location: 'Jakarta Convention Hall',
      startAt: new Date(now.getTime() + 10 * day),
      endAt: new Date(now.getTime() + 10 * day + 3 * hour),
      capacity: 120,
      status: EVENT_STATUS.DRAFT,
      publishedAt: null,
      cancelReason: null,
    },
    {
      title: 'Published: Startup Networking Night',
      description: 'Open networking session for founders and builders.',
      category: 'business',
      location: 'Bandung Creative Hub',
      startAt: new Date(now.getTime() + 15 * day),
      endAt: new Date(now.getTime() + 15 * day + 4 * hour),
      capacity: 250,
      status: EVENT_STATUS.PUBLISHED,
      publishedAt: new Date(now.getTime() - 2 * day),
      cancelReason: null,
    },
    {
      title: 'Cancelled: UX Research Workshop',
      description: 'Workshop cancelled because speaker was unavailable.',
      category: 'design',
      location: 'Yogyakarta Learning Center',
      startAt: new Date(now.getTime() + 7 * day),
      endAt: new Date(now.getTime() + 7 * day + 6 * hour),
      capacity: 80,
      status: EVENT_STATUS.CANCELLED,
      publishedAt: new Date(now.getTime() - 5 * day),
      cancelReason: 'Speaker unavailable',
    },
    {
      title: 'Archived: Community Townhall Q1',
      description: 'Completed townhall archived for record keeping.',
      category: 'community',
      location: 'Surabaya Grand Theater',
      startAt: new Date(now.getTime() - 30 * day),
      endAt: new Date(now.getTime() - 30 * day + 2 * hour),
      capacity: 300,
      status: EVENT_STATUS.ARCHIVED,
      publishedAt: new Date(now.getTime() - 45 * day),
      cancelReason: null,
    },
  ] as const;

  await prisma.event.deleteMany({
    where: {
      organizerId: organizer.id,
      title: { in: events.map((event) => event.title) },
    },
  });

  await prisma.event.createMany({
    data: events.map((event) => ({
      organizerId: organizer.id,
      ...event,
    })),
  });
}
