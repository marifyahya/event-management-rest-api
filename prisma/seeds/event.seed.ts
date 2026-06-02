import { faker } from '@faker-js/faker';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import { EVENT_STATUS } from '../../src/constants/event-status.js';

export async function seedEvents(prisma: PrismaClient) {
  const organizer = await prisma.user.findFirstOrThrow({
    where: { role: 'admin' },
  });

  function generateEvent(status: string) {
    const isPast = status === EVENT_STATUS.ARCHIVED || (status === EVENT_STATUS.CANCELLED && Math.random() > 0.5);

    const startDate = isPast ? faker.date.past({ years: 0.5 }) : faker.date.future({ years: 0.25 });
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + faker.number.int({ min: 0, max: 2 }));

    const publishedAt = status !== EVENT_STATUS.DRAFT ? faker.date.past({ years: 0.2 }) : undefined;

    const baseEvent = {
      title: faker.lorem.words({ min: 2, max: 5 }),
      description: faker.lorem.sentence({ min: 10, max: 20 }),
      category: faker.person.jobArea(),
      location: `${faker.company.name()}, ${faker.location.city()}`,
      startAt: startDate,
      endAt: endDate,
      price: faker.number.int({ min: 5, max: 100 }) * 10000,
      capacity: faker.number.int({ min: 1, max: 10 }) * 1000,
      status,
    };

    if (status === EVENT_STATUS.DRAFT) return baseEvent;

    return {
      ...baseEvent,
      publishedAt,
      ...(status === EVENT_STATUS.CANCELLED ? { cancelReason: faker.lorem.sentence() } : {}),
    };
  }

  const eventTemplates = [
    ...Array.from({ length: 5 }, () => EVENT_STATUS.DRAFT),
    ...Array.from({ length: 8 }, () => EVENT_STATUS.PUBLISHED),
    ...Array.from({ length: 4 }, () => EVENT_STATUS.CANCELLED),
    ...Array.from({ length: 3 }, () => EVENT_STATUS.ARCHIVED),
  ];

  const events = eventTemplates.map((status) => generateEvent(status));

  for (const event of events) {
    await prisma.event.create({
      data: {
        organizerId: organizer.id,
        ...event,
      },
    });
  }

  console.log(`✅ Seeded ${events.length} events`);
}
